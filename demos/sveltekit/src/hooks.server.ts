import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  tracesSampleRate: 1.0,
  spotlight: import.meta.env.DEV,
});

export const handleError = Sentry.handleErrorWithSentry();

export const handle = Sentry.sentryHandle();
