import { Client, Envelope, Event, Integration } from '@sentry/types';
import { serializeEnvelope } from '@sentry/utils';
import { log } from '../../lib/logger';
import sentryDataCache from './data/sentryDataCache';

type SpotlightBrowserIntegrationOptions = {
  /**
   * The URL of the Sidecar instance to connect and forward events to.
   * If not set, Spotlight will try to connect to the Sidecar running on localhost:8969.
   *
   * @default "http://localhost:8969/stream"
   */
  sidecarUrl?: string;
};

/**
 * A Sentry integration for Spotlight integration that the Overlay will inject automatically.
 * This integration does a couple of things:
 *
 *  - Try to enrich stack traces by querying a potentially existing context lines integration
 *    on the server side  (@see packages/astro/src/vite/source-context.ts)
 *  - Drop transactions created from interactions with the Spotlight UI
 *  - Forward Sentry events sent from the browser SDK to the Sidecar instance running on
 *    either on http://localhost:8969/stream or on the supplied `sidecarUrl` option.
 *
 * @param options - Configuration options for the integration ({@link SpotlightBrowserIntegrationOptions})
 *
 * @returns Sentry integration for Spotlight.
 */
export const spotlightIntegration = (options?: SpotlightBrowserIntegrationOptions) => {
  const _sidecarUrl = options?.sidecarUrl ?? 'http://localhost:8969/stream';

  return {
    name: 'DevServerContextLines',
    setup: () => {
      log('Using Sidecar URL', _sidecarUrl);
    },
    processEvent: async (event: Event) => {
      // We don't want to send interaction transactions/root spans created from
      // clicks within Spotlight to Sentry. Neither do we want them to be sent to
      // spotlight.
      if (isSpotlightInteraction(event)) {
        return null;
      }

      const traceId = event.contexts?.trace?.trace_id;
      if (traceId) {
        sentryDataCache.trackLocalTrace(traceId);
      }

      if (event.type || !event.exception || !event.exception.values) {
        return event;
      }

      for (const exception of event.exception.values ?? []) {
        try {
          const makeFetch = getNativeFetchImplementation();
          const stackTraceWithContextResponse = await makeFetch('/spotlight/contextlines', {
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
    },
    afterAllSetup: (client: Client) => {
      sendEnvelopesToSidecar(client, _sidecarUrl);
    },
  } satisfies Integration;
};

function sendEnvelopesToSidecar(client: Client, sidecarUrl: string) {
  const makeFetch = getNativeFetchImplementation();

  client?.on('beforeEnvelope', (envelope: Envelope) => {
    makeFetch(sidecarUrl, {
      method: 'POST',
      body: serializeEnvelope(envelope),
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      mode: 'cors',
    }).catch(err => {
      console.error(
        `Sentry SDK can't connect to Sidecar is it running? See: https://spotlightjs.com/sidecar/npx/`,
        err,
      );
    });
  });
}

type FetchImpl = typeof fetch;
type WrappedFetchImpl = FetchImpl & { __sentry_original__: FetchImpl };

/**
 * We want to get an unpatched fetch implementation to avoid capturing our own calls.
 */
export function getNativeFetchImplementation(): FetchImpl {
  if (fetchIsWrapped(window.fetch)) {
    return window.fetch.__sentry_original__;
  }

  return window.fetch;
}

function fetchIsWrapped(fetchImpl: FetchImpl): fetchImpl is WrappedFetchImpl {
  return '__sentry_original__' in fetchImpl;
}

/**
 * Flags if the event is a transaction created from an interaction with the spotlight UI.
 */
function isSpotlightInteraction(event: Event): boolean {
  if (event.type === 'transaction' && event.contexts?.trace?.op === 'ui.action.click' && event.spans) {
    const hasSpotlightDescriptor = event.spans.find(s => s.description?.includes('#sentry-spotlight'));
    return !!hasSpotlightDescriptor;
  }
  return false;
}
