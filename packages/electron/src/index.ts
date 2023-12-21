import * as Sentry from '@sentry/electron/renderer';
import * as Spotlight from '@spotlightjs/overlay';

Sentry.init({
  dsn: 'https://192df1a78878de014eb416a99ff70269@o1.ingest.sentry.io/4506400311934976',
  integrations: [
    new Sentry.BrowserTracing(),
    // new Sentry.BrowserProfilingIntegration(),
    new Sentry.Replay({
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

Spotlight.init({
  fullPage: true,
  injectImmediately: true,
  showTriggerButton: false,
  integrations: [Spotlight.sentry({ injectIntoSDK: false })],
});

Spotlight.onSevereEvent(count => {
  window.electronAPI.setBadgeCount(count);
});
