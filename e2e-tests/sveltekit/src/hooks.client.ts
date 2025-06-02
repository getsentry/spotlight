import * as Sentry from "@sentry/sveltekit";
import { init as initSpotlight } from "@spotlightjs/spotlight";

Sentry.init({
  debug: true,
  tracesSampleRate: 1.0,
});

if (import.meta.env.DEV) {
  initSpotlight({ injectImmediately: true, anchor: "bottomRight", debug: true });
}

export const handleError = Sentry.handleErrorWithSentry();
