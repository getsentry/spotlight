import type { Envelope, EnvelopeItem } from "@sentry/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeURLSuffix } from "~/lib/removeURLSuffix";
import { base64Decode } from "../lib/base64";
import * as db from "../lib/db";
import { getSpotlightEventTarget } from "../lib/eventTarget";
import { log } from "../lib/logger";
import { connectToSidecar } from "../sidecar";
import sentryStore from "../telemetry/store";
import type { RawEventContext } from "../types";
import TelemetryView from "./components/TelemetryView";
import useSentryStore from "./store";
import { parseJSONFromBuffer } from "./utils/bufferParsers";

export function setSidecarUrl(url: string) {
  const store = useSentryStore.getState();
  const baseSidecarUrl = removeURLSuffix(url, "/stream");
  store.setSidecarUrl(baseSidecarUrl);
  log("Set sidecar URL for telemetry:", baseSidecarUrl);
}

function getLineEnd(data: Uint8Array): number {
  let end = data.indexOf(0xa);
  if (end === -1) {
    end = data.length;
  }

  return end;
}

/**
 * Implements parser for
 * @see https://develop.sentry.dev/sdk/envelopes/#serialization-format
 * @param rawEvent Envelope data
 * @returns parsed envelope
 */
export function processEnvelope(rawEvent: RawEventContext) {
  let buffer = typeof rawEvent.data === "string" ? Uint8Array.from(rawEvent.data, c => c.charCodeAt(0)) : rawEvent.data;

  function readLine(length?: number) {
    const cursor = length ?? getLineEnd(buffer);
    const line = buffer.subarray(0, cursor);
    buffer = buffer.subarray(cursor + 1);
    return line;
  }

  const envelopeHeader = parseJSONFromBuffer(readLine()) as Envelope[0];

  const items: EnvelopeItem[] = [];
  while (buffer.length) {
    const itemHeader = parseJSONFromBuffer(readLine()) as EnvelopeItem[0];
    const payloadLength = itemHeader.length;
    const itemPayloadRaw = readLine(payloadLength);

    let itemPayload: EnvelopeItem[1];
    try {
      itemPayload = parseJSONFromBuffer(itemPayloadRaw);
      // data sanitization
      if (itemHeader.type) {
        // @ts-expect-error ts(2339) -- We should really stop adding type to payloads
        itemPayload.type = itemHeader.type;
      }
    } catch (err) {
      itemPayload = itemPayloadRaw;
      log(err);
    }

    items.push([itemHeader, itemPayload] as EnvelopeItem);
  }

  const envelope = [envelopeHeader, items] as Envelope;
  useSentryStore.getState().pushEnvelope({ envelope, rawEnvelope: rawEvent });

  return {
    event: envelope,
    rawEvent: rawEvent,
  };
}

type TelemetryRouteProps = {
  sidecarUrl: string;
  showClearEventsButton: boolean;
  initialEvents?: Record<string, (string | Uint8Array)[]>;
};

type EventData = { contentType: string; data: string | Uint8Array };

type ProcessedEnvelope = {
  event: Envelope;
  rawEvent: RawEventContext;
};

const SENTRY_CONTENT_TYPE = "application/x-sentry-envelope";

function processSentryEvent(contentType: string, event: { data: string | Uint8Array }): ProcessedEnvelope {
  return processEnvelope({
    contentType,
    data: event.data,
  });
}

function processInitialEvents(initialEvents: Record<string, (string | Uint8Array)[]>): ProcessedEnvelope[] {
  const result: ProcessedEnvelope[] = [];

  for (const contentType in initialEvents) {
    const contentTypeBits = contentType.split(";");
    const contentTypeWithoutEncoding = contentTypeBits[0];

    if (contentTypeWithoutEncoding !== SENTRY_CONTENT_TYPE) {
      continue;
    }

    const shouldUseBase64 = contentTypeBits[contentTypeBits.length - 1] === "base64";

    for (const data of initialEvents[contentTypeWithoutEncoding]) {
      const processedEvent = processSentryEvent(
        contentTypeWithoutEncoding,
        shouldUseBase64 ? { data: base64Decode(data as string) } : { data },
      );
      if (processedEvent) {
        result.push(processedEvent);
      }
    }
  }

  return result;
}

export function Telemetry({ sidecarUrl, showClearEventsButton, initialEvents = {} }: TelemetryRouteProps) {
  const [sentryEvents, setSentryEvents] = useState<ProcessedEnvelope[]>(() =>
    processInitialEvents(initialEvents || {}),
  );
  const [isOnline, setOnline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  log("TelemetryRoute render", { isInitialized, sentryEvents: sentryEvents.length, isOnline });

  useEffect(() => {
    if (!isInitialized) {
      setSidecarUrl(sidecarUrl);
      setIsInitialized(true);
    }
  }, [isInitialized, sidecarUrl]);

  const contentTypeListeners = useMemo(() => {
    const listener = (event: { data: string | Uint8Array }): void => {
      log(`Received new ${SENTRY_CONTENT_TYPE} event`);
      const processedEvent = processSentryEvent(SENTRY_CONTENT_TYPE, event);

      if (!processedEvent) {
        return;
      }

      setSentryEvents(prev => [...prev, processedEvent]);
    };

    log("Adding listener for", SENTRY_CONTENT_TYPE);

    const result: Record<string, (event: { data: string | Uint8Array }) => void> = Object.create(null);
    result[SENTRY_CONTENT_TYPE] = listener;
    result[`${SENTRY_CONTENT_TYPE};base64`] = event => listener({ data: base64Decode(event.data as string) });
    return result;
  }, []);

  useEffect(
    () => connectToSidecar(sidecarUrl, contentTypeListeners, setOnline) as () => undefined,
    [sidecarUrl, contentTypeListeners],
  );

  const spotlightEventTarget = useMemo(() => getSpotlightEventTarget(), []);

  const dispatchToContentTypeListener = useCallback(
    ({ contentType, data }: EventData) => {
      const contentTypeBits = contentType.split(";");
      const contentTypeWithoutEncoding = contentTypeBits[0];

      if (contentTypeWithoutEncoding !== SENTRY_CONTENT_TYPE) {
        log("Got event for unknown content type:", contentTypeWithoutEncoding);
        return;
      }

      const listener = contentTypeListeners[contentTypeWithoutEncoding];
      if (!listener) {
        return;
      }
      const event =
        contentTypeBits[contentTypeBits.length - 1] === "base64" ? { data: base64Decode(data as string) } : { data };
      listener(event);
    },
    [contentTypeListeners],
  );

  useEffect(() => {
    // Populate from DB
    db.getEntries().then(entries => {
      for (const detail of entries as EventData[]) {
        dispatchToContentTypeListener(detail);
      }
    });
  }, [dispatchToContentTypeListener]);

  // contextId for namespacing of routes in sessionStorage
  const contextId = sidecarUrl;

  const clearEvents = useCallback(async () => {
    try {
      const clearEventsUrl: string = new URL("/clear", sidecarUrl).href;

      await db.reset();
      await fetch(clearEventsUrl, {
        method: "DELETE",
        mode: "cors",
      });
    } catch (err) {
      console.error(`Spotlight can't connect to Sidecar is it running? See: https://spotlightjs.com/sidecar/npx/`, err);
      return;
    }

    setSentryEvents([]);
    sentryStore.getState().resetData();
  }, [sidecarUrl]);

  const onNavigate = useCallback(
    (e: CustomEvent<string>) => {
      log("Navigate");
      navigate(e.detail);
    },
    [navigate],
  );

  const onEvent = useCallback(
    ({ detail }: CustomEvent<EventData>) => {
      dispatchToContentTypeListener(detail);
      db.add(detail);
    },
    [dispatchToContentTypeListener],
  );

  useEffect(() => {
    log("useEffect: Adding event listeners");
    spotlightEventTarget.addEventListener("navigate", onNavigate as EventListener);
    spotlightEventTarget.addEventListener("clearEvents", clearEvents as EventListener);
    spotlightEventTarget.addEventListener("event", onEvent as EventListener);

    return (): undefined => {
      log("useEffect[destructor]: Removing event listeners");
      spotlightEventTarget.removeEventListener("navigate", onNavigate as EventListener);
      spotlightEventTarget.removeEventListener("clearEvents", clearEvents as EventListener);
      spotlightEventTarget.removeEventListener("event", onEvent as EventListener);
    };
  }, [spotlightEventTarget, onNavigate, clearEvents, onEvent]);

  return <TelemetryView isOnline={isOnline} showClearEventsButton={showClearEventsButton} contextId={contextId} />;
}
