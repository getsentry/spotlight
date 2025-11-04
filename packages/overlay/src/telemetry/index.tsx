import { SENTRY_CONTENT_TYPE } from "@spotlightjs/sidecar/constants";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type TelemetryRouteProps = {
  sidecarUrl: string;
};

export function Telemetry({ sidecarUrl }: TelemetryRouteProps) {
  const [isOnline, setOnline] = useState(false);

  log("TelemetryRoute render", { isOnline });

  const listener = useCallback((event: string): void => {
    log(`Received new ${SENTRY_CONTENT_TYPE} event`);
    const envelope = typeof event === "string" ? JSON.parse(event) : event;
    useSentryStore.getState().pushEnvelope(envelope);
  }, []);

  const contentTypeListeners = useMemo(() => {
    log("Adding listener for", SENTRY_CONTENT_TYPE);

    const result: Record<string, (event: string) => void> = Object.create(null);
    result[SENTRY_CONTENT_TYPE] = listener;
    result[`${SENTRY_CONTENT_TYPE};base64`] = event => listener(event);
    return result;
  }, [listener]);

  useEffect(() => {
    setSidecarUrlInStore(sidecarUrl);
  }, [sidecarUrl]);

  useEffect(
    () => connectToSidecar(sidecarUrl, contentTypeListeners, setOnline) as () => undefined,
    [sidecarUrl, contentTypeListeners],
  );

  return <TelemetryView isOnline={isOnline} contextId={sidecarUrl} />;
}
