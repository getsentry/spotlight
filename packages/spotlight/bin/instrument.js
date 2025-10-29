import { consoleLoggingIntegration, init, spotlightIntegration } from "@sentry/node";

// Check if SENTRY_SPOTLIGHT is set, which would cause a feedback loop
// where Spotlight sends its own telemetry to itself
const spotlightUrl = process.env.SENTRY_SPOTLIGHT;
const isSpotlightSelfReferencing = Boolean(spotlightUrl);

if (isSpotlightSelfReferencing) {
  console.warn(
    "⚠️  [Spotlight] SENTRY_SPOTLIGHT environment variable is set. " +
      "Disabling Spotlight integration to prevent feedback loop where Spotlight sends telemetry to itself.",
  );
}

const sentry = init({
  dsn: "https://51bcd92dba1128934afd1c5726c84442@o1.ingest.us.sentry.io/4508404727283713",
  environment: process.env.NODE_ENV || "development",
  release: `spotlight@${process.env.npm_package_version}`,
  debug: Boolean(process.env.SENTRY_DEBUG),

  tracesSampleRate: 1,
  enableLogs: true,

  integrations: defaults => {
    const integrations = [
      consoleLoggingIntegration({
        levels: ["log", "info", "warn", "error", "debug"],
      }),
    ];

    // Remove spotlightIntegration if SENTRY_SPOTLIGHT is set to prevent feedback loop
    if (isSpotlightSelfReferencing) {
      return integrations.concat(defaults.filter(integration => integration.name !== "Spotlight"));
    }

    return integrations.concat(defaults);
  },

  beforeSendTransaction: event => {
    event.server_name = undefined; // Server name might contain PII
    return event;
  },

  beforeSend: event => {
    const exceptions = event.exception?.values;
    if (!exceptions) {
      return event;
    }
    for (const exception of exceptions) {
      if (!exception.stacktrace) {
        continue;
      }

      for (const frame of exception.stacktrace.frames) {
        if (!frame.filename) {
          continue;
        }

        const homeDir = process.env.HOME || process.env.USERPROFILE;
        frame.filename = frame.filename?.replace(homeDir, "~");
      }
    }

    event.server_name = undefined; // Server name might contain PII
    return event;
  },
});

function shutdown() {
  sentry.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
// process.on("beforeExit", shutdown);
