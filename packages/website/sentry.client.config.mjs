import * as Sentry from '@sentry/astro';

Sentry.init({
  debug: process.env.NODE_ENV === "development",
  dsn: "https://b6308e6c658001f198a10016d828a0d9@o1.ingest.sentry.io/4506349052231680",
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend: (event) => {
    const message = event.exception?.values?.[0]?.value || "";
    const userAgent =
      event.request?.headers?.["User-Agent"] || (typeof navigator !== "undefined" ? navigator.userAgent : "");

    // Filter bot/crawler errors
    if (
      userAgent.toLowerCase().includes("bot") ||
      userAgent.includes("Spider") ||
      userAgent.includes("WebPageTest")
    ) {
      return null;
    }

    // Dynamic import failures - network issues
    if (message.includes("Failed to fetch dynamically imported module")) {
      return null;
    }

    // Load failed (network issues)
    if (message === "Load failed" || message.includes("TypeError: Load failed")) {
      return null;
    }

    // NS_ERROR_FAILURE (Firefox-specific internal error)
    if (message.includes("NS_ERROR_FAILURE")) {
      return null;
    }

    return event;
  },
});
