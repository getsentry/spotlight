import { consoleLoggingIntegration, getClient, init } from "@sentry/node";
import { parseCLIArgs } from "@spotlightjs/sidecar/cli";
import { DEFAULT_PORT } from "@spotlightjs/sidecar/constants";

// Parse CLI arguments to determine the port this Spotlight instance will use
const { port: instancePort } = parseCLIArgs();

// Check if SENTRY_SPOTLIGHT points to this instance
const spotlightEnv = process.env.SENTRY_SPOTLIGHT;
let disableSpotlight = false;

// Note: If port is set to 0 (dynamic port assignment), we cannot detect the actual port
// before starting the server, so we cannot prevent the feedback loop in that case.
// The server will be assigned a port by the OS after it starts, and if SENTRY_SPOTLIGHT
// happens to point to that same port, a feedback loop may occur.
if (spotlightEnv && instancePort !== 0) {
  let targetPort: number | undefined;
  let targetHost: string | undefined;

  // SENTRY_SPOTLIGHT can be:
  // 1. A full URL like "http://localhost:8969"
  // 2. A truthy value (true, t, y, yes, on, 1) which means use the default URL
  const TRUTHY_ENV_VALUES = new Set(["true", "t", "y", "yes", "on", "1"]);
  const isTruthy = TRUTHY_ENV_VALUES.has(spotlightEnv.toLowerCase());

  if (isTruthy) {
    // Use default Spotlight URL
    targetHost = "localhost";
    targetPort = DEFAULT_PORT;
  } else {
    // Try to parse as URL
    try {
      const spotlightUrl = new URL(spotlightEnv);
      targetHost = spotlightUrl.hostname;
      targetPort = spotlightUrl.port ? Number(spotlightUrl.port) : spotlightUrl.protocol === "https:" ? 443 : 80;
    } catch (_err) {
      // If we can't parse it, we can't determine if it's a feedback loop, so do nothing
      targetPort = undefined;
    }
  }

  // Only disable if we successfully determined the target and it matches our instance
  if (targetPort !== null && targetPort !== undefined) {
    const isLocalhost = targetHost === "localhost" || targetHost === "127.0.0.1" || targetHost === "::1";

    if (isLocalhost && targetPort === instancePort) {
      disableSpotlight = true;
      console.warn(
        `⚠️  [Spotlight] SENTRY_SPOTLIGHT is set to ${spotlightEnv} which points to this Spotlight instance (port ${instancePort}). Disabling Spotlight integration to prevent feedback loop.`,
      );
    }
  }
}

const sentry = init({
  dsn: "https://51bcd92dba1128934afd1c5726c84442@o1.ingest.us.sentry.io/4508404727283713",
  environment: process.env.NODE_ENV || "development",
  release: `spotlight@${process.env.npm_package_version}`,
  debug: Boolean(process.env.SENTRY_DEBUG),

  tracesSampleRate: 1,
  enableLogs: true,
  ...(disableSpotlight && { spotlight: false }),

  integrations: [
    consoleLoggingIntegration({
      levels: ["log", "info", "warn", "error", "debug"],
    }),
  ],

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
      if (!exception.stacktrace || !exception.stacktrace.frames) {
        continue;
      }

      for (const frame of exception.stacktrace.frames) {
        if (!frame.filename) {
          continue;
        }

        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
          frame.filename = frame.filename?.replace(homeDir, "~");
        }
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
