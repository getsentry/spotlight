import * as Sentry from "@sentry/react";
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from "react-router-dom";
import { useEffect } from "../react-instance";
import { getDataFromServerTiming } from "./serverTimingMeta";

const TRACE_PARENT_KEYS = ["sentryTrace", "baggage"];

export default function initSentry() {
  const traceParentData = TRACE_PARENT_KEYS.map(key => [key, getDataFromServerTiming(key)]);

  const hasTraceParent = traceParentData.every(([, value]) => Boolean(value));
  const integrations = [
    // See docs for support of different versions of variation of react router
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
    Sentry.reactRouterV6BrowserTracingIntegration({
      instrumentPageLoad: !hasTraceParent,
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration(),
    Sentry.browserProfilingIntegration(),
  ];
  const hash = document.location.hash.slice(1);
  if (hash.startsWith("spotlight")) {
    const splitterPos = hash.indexOf("=");
    const sidecarUrl = splitterPos > -1 ? decodeURIComponent(hash.slice(splitterPos + 1)) : undefined;
    integrations.push(Sentry.browserTracingIntegration({ sidecarUrl }));
  }

  const sentryClient = Sentry.init({
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
    dsn: "https://51bcd92dba1128934afd1c5726c84442@o1.ingest.us.sentry.io/4508404727283713",
    environment: process.env.NODE_ENV || "development",
    release: `spotlight@${process.env.npm_package_version}`,

    integrations,

    tracesSampleRate: 1,
    tracePropagationTargets: [/^\//, document.location.origin],
    profilesSampleRate: 1,

    // Capture Replay for 1% of all sessions,
    // plus for 100% of sessions with an error
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
  });

  if (hasTraceParent && sentryClient) {
    Sentry.startBrowserTracingPageLoadSpan(sentryClient, { name: "pageload" }, Object.fromEntries(traceParentData));
  }
}
