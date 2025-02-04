import { serializeEnvelope } from '@sentry/core';
import type { Client, Envelope, Event, Integration } from '@sentry/types';
import { trigger } from '../../lib/eventTarget';
import { log } from '../../lib/logger';
import sentryDataCache from './data/sentryDataCache';

/**
 * A Sentry integration for Spotlight integration that the Overlay will inject automatically.
 * This integration does the following:
 *
 *  - Drop transactions created from interactions with the Spotlight UI
 *  - Forward Sentry events sent from the browser SDK to the Spotlight instance running on
 *    the same page via the "direct message" method (w/o a need for the sidecar)
 *
 * @returns Sentry integration for Spotlight.
 */
export const spotlightIntegration = () => {
  return {
    name: 'SpotlightBrowserDirect',
    setupOnce: () => {
      /* Empty function to ensure compatibility w/ JS SDK v7 >= 7.99.0 */
    },
    setup: () => {},
    processEvent: (event: Event) => {
      // We don't want to send interaction transactions/root spans created from
      // clicks within Spotlight to Sentry. Neither do we want them to be sent to
      // spotlight.
      if (isSpotlightInteraction(event)) {
        log('Dropping transaction created from Spotlight interaction');
        return null;
      }

      const traceId = event.contexts?.trace?.trace_id;
      if (traceId) {
        sentryDataCache.trackLocalTrace(traceId);
      }

      return event;
    },
    afterAllSetup: (client: Client) =>
      client.on('beforeEnvelope', (envelope: Envelope) =>
        trigger('event', { contentType: 'application/x-sentry-envelope', data: serializeEnvelope(envelope) }),
      ),
  } satisfies Integration;
};

/**
 * Flags if the event is a transaction created from an interaction with the spotlight UI.
 */
function isSpotlightInteraction(event: Event): boolean {
  if (event.type === 'transaction' && event.contexts?.trace?.op === 'ui.action.click' && event.spans) {
    for (const span of event.spans.values()) {
      if (span.description?.includes('#sentry-spotlight')) {
        return true;
      }
    }
  }

  return false;
}
