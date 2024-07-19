import * as Sentry from '@sentry/astro';

Sentry.init({
  debug: true,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
});

if (process.env.NODE_ENV === 'development') {
  import('@spotlightjs/astro').then(Spotlight => {
    const client = Sentry.getClient();
    if (client && client.on) {
      client.on('beforeSendEvent', event => {
        if (event.exception && event.exception.values && event.exception.values[0].mechanism?.handled === false) {
          Spotlight.trigger('sentry:showError', { event });
        }
      });
    }
  });
}
