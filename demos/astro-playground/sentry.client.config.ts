import * as Sentry from '@sentry/astro';

Sentry.init({
  debug: true,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
});
