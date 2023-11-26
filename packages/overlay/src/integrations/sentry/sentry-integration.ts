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
        try {
          const stackTraceWithContextResponse = await fetch('/spotlight/contextlines', {
            method: 'PUT',
            body: JSON.stringify(exception.stacktrace),
          });

          if (!stackTraceWithContextResponse.ok || stackTraceWithContextResponse.status !== 200) {
            continue;
          }

          const stackTraceWithContext = await stackTraceWithContextResponse.json();
          exception.stacktrace = stackTraceWithContext;
        } catch {
          // Something went wrong, for now we just ignore it.
        }
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
        console.error(
          `Sentry SDK can't connect to Sidcar is it running? See: https://spotlightjs.com/sidecar/npx/`,
          err,
        );
      });
    });
  }
}
