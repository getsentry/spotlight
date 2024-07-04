import * as Sentry from '@sentry/astro';

Sentry.init({
  debug: process.env.NODE_ENV === 'development',
  dsn: 'https://b6308e6c658001f198a10016d828a0d9@o1.ingest.sentry.io/4506349052231680',
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
