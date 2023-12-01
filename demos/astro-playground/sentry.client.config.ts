import * as Sentry from '@sentry/astro';
import { getCurrentHub, type Event } from '@sentry/astro';

Sentry.init({
  debug: true,
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  tracesSampleRate: 1.0,
});

if (process.env.NODE_ENV === 'development') {
  import('@spotlightjs/astro').then(Spotlight => {
    const client = getCurrentHub().getClient();
    if (client && client.on) {
      client.on('beforeSendEvent', (event: Event) => {
        if (event.exception && event.exception.values && event.exception.values[0].mechanism?.handled === false) {
          Spotlight.trigger('sentry:showError', { eventId: event.event_id, event });
        }
      });
    }
  });
}
