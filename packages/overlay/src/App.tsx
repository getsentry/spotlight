import type { Envelope } from "@sentry/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as db from "./lib/db";
import { getSpotlightEventTarget } from "./lib/eventTarget";
import { log } from "./lib/logger";
import { connectToSidecar } from "./sidecar";
import { processEnvelope } from "./telemetry";
import TelemetryView from "./telemetry/components/TelemetryView";
import sentryStore from "./telemetry/store";

type AppProps = {
  sidecarUrl: string;
  showClearEventsButton?: boolean;
  startFrom?: string;
};

type EventData = { contentType: string; data: string };

const SENTRY_CONTENT_TYPE = "application/x-sentry-envelope";

export default function App({ sidecarUrl, showClearEventsButton = true, startFrom }: AppProps) {
  const [sentryEvents, setSentryEvents] = useState<Envelope[]>([]);
  const [isOnline, setOnline] = useState(false);
  log("App rerender", sentryEvents, isOnline);

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
      listener(data);
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

  const navigate = useNavigate();

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

  useEffect(() => {
    if (startFrom) {
      navigate(startFrom);
    }
  }, [startFrom, navigate]);

  return <TelemetryView isOnline={isOnline} showClearEventsButton={showClearEventsButton} contextId={contextId} />;
}
