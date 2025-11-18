import { init as ElectronSentryInit } from "@sentry/electron/renderer";
import { init as ReactSentryInit } from "@sentry/react";
import { _init } from "./index";
import { getIntegrations } from "./ui/lib/instrumentation";

// Static import - this blocks execution until Sentry loads
// Uses Sentry's recommended "Framework-Specific SDK" pattern
// https://docs.sentry.io/platforms/javascript/guides/electron/#using-framework-specific-sdks
ElectronSentryInit(
  {
    dsn: "https://192df1a78878de014eb416a99ff70269@o1.ingest.sentry.io/4506400311934976",
    environment: process.env.NODE_ENV,
    release: `spotlight@${process.env.npm_package_version}`,
    integrations: getIntegrations(true),
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  },
  ReactSentryInit,
);

// Now initialize the app after Sentry is ready
_init({ debug: true });

