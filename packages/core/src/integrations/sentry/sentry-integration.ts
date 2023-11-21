import { Client, Envelope, Event, EventProcessor, Hub, Integration } from '@sentry/types';
import { serializeEnvelope } from '@sentry/utils';

export class Spotlight implements Integration {
  public name: string = 'DevServerContextLines';

  public setupOnce(addGlobalEventProcessor: (callback: EventProcessor) => void, getCurrentHub: () => Hub): void {
    addGlobalEventProcessor(async (event: Event) => {
      if (event.type || !event.exception || !event.exception.values) {
        return event;
      }

      for (const exception of event.exception.values ?? []) {
        console.log('fetching', exception);
        const stackTraceWithContextResponse = await fetch('/spotlight/contextlines', {
          method: 'PUT',
          body: JSON.stringify(exception.stacktrace),
        });
        const stackTraceWithContext = await stackTraceWithContextResponse.json();
        console.log('xxx', { stackTraceWithContext });
        exception.stacktrace = stackTraceWithContext;
      }
      return event;
    });

    const client = getCurrentHub().getClient();
    if (client) {
      sendEnvelopesToSidecar(client);
    }
  }
}

function sendEnvelopesToSidecar(client: Client) {
  // Ensure, integrations are initialized even if no DSN was set
  client?.setupIntegrations(true);

  if (client.on) {
    client?.on('beforeEnvelope', (envelope: Envelope) => {
      fetch('http://localhost:8969/stream', {
        method: 'POST',
        body: serializeEnvelope(envelope),
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
        },
        mode: 'cors',
      }).catch(err => {
        console.error(err);
      });
    });
  }
}
