import * as Sentry from '@sentry/astro';

Sentry.init({
  debug: true,
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 1.0,
});
