import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  tracesSampleRate: 1.0,
});

export const handleError = Sentry.handleErrorWithSentry();
