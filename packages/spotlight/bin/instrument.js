import { consoleLoggingIntegration, getClient, init } from "@sentry/node";
import { parseCLIArgs } from "@spotlightjs/sidecar/cli";

// Parse CLI arguments to determine the port this Spotlight instance will use
const { port: instancePort } = parseCLIArgs();

// Check if SENTRY_SPOTLIGHT points to this instance
const spotlightEnv = process.env.SENTRY_SPOTLIGHT;
let disableSpotlight = false;

// Note: If port is set to 0 (dynamic port assignment), we cannot detect the actual port
// before starting the server, so we cannot prevent the feedback loop in that case.
// The server will be assigned a port by the OS after it starts.
if (spotlightEnv && instancePort !== 0) {
  try {
    // Parse the SENTRY_SPOTLIGHT URL to extract the port
    const spotlightUrl = new URL(spotlightEnv.startsWith("http") ? spotlightEnv : `http://${spotlightEnv}`);
    const spotlightPort = spotlightUrl.port ? Number(spotlightUrl.port) : spotlightUrl.protocol === "https:" ? 443 : 80;
    const spotlightHost = spotlightUrl.hostname;

    // Check if it points to localhost/127.0.0.1 with our instance port
    const isLocalhost = spotlightHost === "localhost" || spotlightHost === "127.0.0.1" || spotlightHost === "::1";

    if (isLocalhost && spotlightPort === instancePort) {
      disableSpotlight = true;
      console.warn(
        `⚠️  [Spotlight] SENTRY_SPOTLIGHT is set to ${spotlightEnv} which points to this Spotlight instance (port ${instancePort}). Disabling Spotlight integration to prevent feedback loop.`,
      );
    }
  } catch (_err) {
    // If URL parsing fails, disable spotlight to be safe
    console.warn(
      `⚠️  [Spotlight] Failed to parse SENTRY_SPOTLIGHT URL: ${spotlightEnv}. Disabling Spotlight integration to prevent potential feedback loop.`,
    );
    disableSpotlight = true;
  }
} else if (spotlightEnv && instancePort === 0) {
  console.warn(
    "⚠️  [Spotlight] SENTRY_SPOTLIGHT is set and dynamic port assignment is being used (port 0). " +
      "Cannot detect feedback loop as the actual port is unknown until server starts. " +
      "If the ports match, a feedback loop may occur.",
  );
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
