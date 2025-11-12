import * as Sentry from "@sentry/electron/renderer";
import * as Spotlight from "./index";
import useSentryStore from "@spotlight/ui/telemetry/store";
import { isErrorEvent } from "@spotlight/ui/telemetry/utils/sentry";

Sentry.init({
  dsn: "https://192df1a78878de014eb416a99ff70269@o1.ingest.sentry.io/4506400311934976",
  environment: process.env.NODE_ENV,
  release: `spotlight@${process.env.npm_package_version}`,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  replaysSessionSampleRate: 1.1,
  replaysOnErrorSampleRate: 1.0,
});

Spotlight._init();

// Subscribe to events and update badge count when severe events occur
function updateBadgeCount() {
  if (typeof window === "undefined" || !window.electronAPI) {
    return;
  }

  const store = useSentryStore.getState();
  const events = store.getEvents();
  const errorCount = events.reduce((sum, e) => sum + Number(isErrorEvent(e)), 0);
  window.electronAPI.setBadgeCount(errorCount);
}

// Wait for window and electronAPI to be available, then set up subscription
function setupBadgeCountSubscription() {
  if (typeof window === "undefined" || !window.electronAPI) {
    // Retry after a short delay if electronAPI is not yet available
    setTimeout(setupBadgeCountSubscription, 100);
    return;
  }

  const store = useSentryStore.getState();
  
  // Set initial badge count
  updateBadgeCount();

  // Subscribe to new events
  store.subscribe("event", () => {
    updateBadgeCount();
  });
}

// Start setting up the subscription once the DOM is ready
if (document.readyState === "complete") {
  setupBadgeCountSubscription();
} else {
  window.addEventListener("load", setupBadgeCountSubscription);
}
