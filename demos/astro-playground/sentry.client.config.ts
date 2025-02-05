import * as Sentry from '@sentry/astro';

Sentry.init({
  debug: true,
  integrations: [Sentry.browserProfilingIntegration()],
  profilesSampleRate: 1.0,
});
