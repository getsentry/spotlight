import type { Envelope } from "@sentry/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { removeURLSuffix } from "~/lib/removeURLSuffix";
import { connectToSidecar } from "~/sidecar";
import { SENTRY_CONTENT_TYPE } from "../../shared/constants";
import { getSpotlightEventTarget } from "../lib/eventTarget";
import { log } from "../lib/logger";
import TelemetryView from "./components/TelemetryView";
import useSentryStore from "./store";

export function setSidecarUrlInStore(url: string) {
  const store = useSentryStore.getState();
  const baseSidecarUrl = removeURLSuffix(url, "/stream");
  store.setSidecarUrl(baseSidecarUrl);
  log("Set sidecar URL for telemetry:", baseSidecarUrl);
}

/**
 * Implements parser for
 * @see https://develop.sentry.dev/sdk/envelopes/#serialization-format
 * @param rawEvent Envelope data
 * @returns parsed envelope
 */
export function processEnvelope(rawEvent: string | Envelope) {
  const envelope = typeof rawEvent === "string" ? JSON.parse(rawEvent) : rawEvent;
  useSentryStore.getState().pushEnvelope(envelope);

  return envelope as Envelope;
}

type TelemetryRouteProps = {
  sidecarUrl: string;
};

type EventData = { contentType: string; data: string };

export function Telemetry({ sidecarUrl }: TelemetryRouteProps) {
  const [sentryEvents, setSentryEvents] = useState<Envelope[]>([]);
  const [isOnline, setOnline] = useState(false);

  log("TelemetryRoute render", { sentryEvents: sentryEvents.length, isOnline });

  const contentTypeListeners = useMemo(() => {
    const listener = (event: string): void => {
      log(`Received new ${SENTRY_CONTENT_TYPE} event`);
      const processedEvent = processEnvelope(event);

      if (!processedEvent) {
        return;
      }

      setSentryEvents(prev => [...prev, processedEvent]);
    };

    log("Adding listener for", SENTRY_CONTENT_TYPE);

    const result: Record<string, (event: string) => void> = Object.create(null);
    result[SENTRY_CONTENT_TYPE] = listener;
    result[`${SENTRY_CONTENT_TYPE};base64`] = event => listener(event);
    return result;
  }, []);

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
      listener(data);
    },
    [contentTypeListeners],
  );

  const contextId = sidecarUrl;

  const clearEvents = useCallback(async () => {
    try {
      const clearEventsUrl: string = new URL("/clear", sidecarUrl).href;

      await fetch(clearEventsUrl, {
        method: "DELETE",
        mode: "cors",
      });
    } catch (err) {
      console.error(`Spotlight can't connect to Sidecar is it running? See: https://spotlightjs.com/sidecar/npx/`, err);
      return;
    }

    setSentryEvents([]);
    useSentryStore.getState().resetData();
  }, [sidecarUrl]);

  const onEvent = useCallback(
    ({ detail }: CustomEvent<EventData>) => {
      dispatchToContentTypeListener(detail);
    },
    [dispatchToContentTypeListener],
  );

  useEffect(() => {
    setSidecarUrlInStore(sidecarUrl);
  }, [sidecarUrl]);

  useEffect(
    () => connectToSidecar(sidecarUrl, contentTypeListeners, setOnline) as () => undefined,
    [sidecarUrl, contentTypeListeners],
  );

  useEffect(() => {
    log("useEffect: Adding event listeners");
    spotlightEventTarget.addEventListener("clearEvents", clearEvents as EventListener);
    spotlightEventTarget.addEventListener("event", onEvent as EventListener);

    return (): undefined => {
      log("useEffect[destructor]: Removing event listeners");
      spotlightEventTarget.removeEventListener("clearEvents", clearEvents as EventListener);
      spotlightEventTarget.removeEventListener("event", onEvent as EventListener);
    };
  }, [spotlightEventTarget, clearEvents, onEvent]);

  return <TelemetryView isOnline={isOnline} contextId={contextId} />;
}
