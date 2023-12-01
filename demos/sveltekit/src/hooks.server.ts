import * as Sentry from '@sentry/sveltekit';
import { setupSidecar } from '@spotlightjs/spotlight/sidecar';

Sentry.init({
	debug: true,
	tracesSampleRate: 1.0,
	spotlight: import.meta.env.DEV
});

if (import.meta.env.DEV) {
	setupSidecar();
}

export const handleError = Sentry.handleErrorWithSentry();

export const handle = Sentry.sentryHandle();
