import { init as ElectronSentryInit } from "@sentry/electron/renderer";
import { init as ReactSentryInit } from "@sentry/react";
import { _init } from "./index";
import { sentryBaseConfig } from "./sentry-config";
import { getIntegrations } from "./ui/lib/instrumentation";

// Static import - this blocks execution until Sentry loads
// Uses Sentry's recommended "Framework-Specific SDK" pattern for Electron v7+
// https://docs.sentry.io/platforms/javascript/guides/electron/#using-framework-specific-sdks
ElectronSentryInit(
  {
    ...sentryBaseConfig,
    dsn: "https://192df1a78878de014eb416a99ff70269@o1.ingest.sentry.io/4506400311934976",
    environment: process.env.NODE_ENV || sentryBaseConfig.environment,
    integrations: getIntegrations(true),
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    beforeSend: event => {
      const message = event.exception?.values?.[0]?.value || "";

      // Dynamic import failures - network/caching issues
      if (message.includes("Failed to fetch dynamically imported module")) {
        return null;
      }

      return event;
    },
  },
  ReactSentryInit,
);

// Now initialize the app after Sentry is ready
_init();
