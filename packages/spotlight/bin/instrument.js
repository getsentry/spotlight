import { init } from "@sentry/node";

init({
  dsn: "https://51bcd92dba1128934afd1c5726c84442@o1.ingest.us.sentry.io/4508404727283713",
  environment: process.env.NODE_ENV || "development",
  release: `spotlight@${process.env.npm_package_version}`,
  debug: Boolean(process.env.SENTRY_DEBUG),

  tracesSampleRate: 1,

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
