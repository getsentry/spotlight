import type { Envelope } from "@sentry/core";
import { SENTRY_CONTENT_TYPE } from "@spotlightjs/sidecar/constants";
import { useEffect, useMemo, useState } from "react";
import { removeURLSuffix } from "~/lib/removeURLSuffix";
import { log } from "../lib/logger";
import { connectToSidecar } from "../sidecar";
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

  useEffect(() => {
    setSidecarUrlInStore(sidecarUrl);
  }, [sidecarUrl]);

  useEffect(
    () => connectToSidecar(sidecarUrl, contentTypeListeners, setOnline) as () => undefined,
    [sidecarUrl, contentTypeListeners],
  );

  return <TelemetryView isOnline={isOnline} contextId={sidecarUrl} />;
}
