import { type Client, type Envelope, type EnvelopeItem } from '@sentry/core';
import { removeURLSuffix } from '~/lib/removeURLSuffix';
import { off, on } from '../../lib/eventTarget';
import { log, warn } from '../../lib/logger';
import type { Integration, RawEventContext } from '../integration';
import useSentryStore from './data/sentryStore';
import { spotlightIntegration } from './sentry-integration';
import ErrorsTab from './tabs/ErrorsTab';
import InsightsTab from './tabs/InsightsTab';

import { spotlightBrowserIntegration } from '@sentry/browser';
import TracesTab from './tabs/TracesTab';
import type { SentryEvent } from './types';
import { parseJSONFromBuffer } from './utils/bufferParsers';
import { isErrorEvent } from './utils/sentry';
import { createTab } from './utils/tabs';

const HEADER = 'application/x-sentry-envelope';

type SentryIntegrationOptions = {
  injectIntoSDK?: boolean;
  openLastError?: boolean;
  retries?: number;
};

export default function sentryIntegration(options: SentryIntegrationOptions = {}) {
  return {
    name: 'sentry',
    forwardedContentType: [HEADER],

    setup: ({ open, sidecarUrl }) => {
      const store = useSentryStore.getState();

      if (sidecarUrl) {
        const baseSidecarUrl = removeURLSuffix(sidecarUrl, '/stream');
        store.setSidecarUrl(baseSidecarUrl);
      }

      log('Setting up Sentry integration for Spotlight');
      addSpotlightIntegrationToSentry(options, sidecarUrl);

      if (options.openLastError) {
        const unsubscribe = useSentryStore.subscribe((state: { events: SentryEvent[] }) => {
          const events = state.events;
          if (events.length > 0) {
            const lastEvent = events[events.length - 1];
            if (isErrorEvent(lastEvent)) {
              setTimeout(() => open(`/errors/${lastEvent.event_id}`), 0);
            }
          }
        });

        return () => {
          unsubscribe();
        };
      }

      const onRenderError = (e: CustomEvent) => {
        log('Sentry Event', e.detail.event_id);
        if (!e.detail.event) return;
        store.pushEvent(e.detail.event).then(() => open(`/errors/${e.detail.event.event_id}`));
      };

      on('sentry:showError', onRenderError as EventListener);

      return () => {
        off('sentry:showError', onRenderError as EventListener);
      };
    },

    processEvent: (event: RawEventContext) => processEnvelope(event),

    tabs: () => {
      const store = useSentryStore.getState();

      const errorCount = store
        .getEvents()
        .reduce(
          (sum, e) =>
            sum +
            Number(
              isErrorEvent(e) &&
                (e.contexts?.trace?.trace_id ? store.isTraceLocal(e.contexts?.trace?.trace_id) : null) !== false,
            ),
          0,
        );

      const localTraceCount = store
        .getTraces()
        .reduce((sum, t) => sum + Number(store.isTraceLocal(t.trace_id) !== false), 0);

      return [
        createTab('traces', 'Traces', {
          notificationCount: {
            count: localTraceCount,
          },
          content: TracesTab,
        }),
        createTab('errors', 'Errors', {
          notificationCount: {
            count: errorCount,
            severe: errorCount > 0,
          },
          content: ErrorsTab,
        }),
        createTab('insights', 'Insights', {
          content: InsightsTab,
        }),
      ];
    },

    reset: () => {
      useSentryStore.getState().resetData();
    },
  } satisfies Integration<Envelope>;
}

function getLineEnd(data: Uint8Array): number {
  let end = data.indexOf(0xa);
  if (end === -1) {
    end = data.length;
  }

  return end;
}

/**
 * Implements parser for
 * @see https://develop.sentry.dev/sdk/envelopes/#serialization-format
 * @param rawEvent Envelope data
 * @returns parsed envelope
 */
export function processEnvelope(rawEvent: RawEventContext) {
  let buffer = typeof rawEvent.data === 'string' ? Uint8Array.from(rawEvent.data, c => c.charCodeAt(0)) : rawEvent.data;

  function readLine(length?: number) {
    const cursor = length ?? getLineEnd(buffer);
    const line = buffer.subarray(0, cursor);
    buffer = buffer.subarray(cursor + 1);
    return line;
  }

  const envelopeHeader = parseJSONFromBuffer(readLine()) as Envelope[0];

  const items: EnvelopeItem[] = [];
  while (buffer.length) {
    const itemHeader = parseJSONFromBuffer(readLine()) as EnvelopeItem[0];
    const payloadLength = itemHeader.length;
    const itemPayloadRaw = readLine(payloadLength);

    let itemPayload: EnvelopeItem[1];
    try {
      itemPayload = parseJSONFromBuffer(itemPayloadRaw);
      // data sanitization
      if (itemHeader.type) {
        // @ts-expect-error ts(2339) -- We should really stop adding type to payloads
        itemPayload.type = itemHeader.type;
      }
    } catch (err) {
      itemPayload = itemPayloadRaw;
      log(err);
    }

    items.push([itemHeader, itemPayload] as EnvelopeItem);
  }

  const envelope = [envelopeHeader, items] as Envelope;
  useSentryStore.getState().pushEnvelope({ envelope, rawEnvelope: rawEvent });

  return {
    event: envelope,
    rawEvent: rawEvent,
  };
}

type V8Carrier = {
  stack: {
    getScope?: () => {
      getClient?: () => Client | undefined;
    };
  };
};

type LegacyCarrier = {
  /** pre-v8 way of accessing client (v7 and earlier) */
  hub?: {
    getClient?: () => Client | undefined;
  };
};

type VersionedCarrier = { version: string } & Record<Exclude<string, 'version'>, V8Carrier>;

type WindowWithSentry = Window & {
  __SENTRY__?: LegacyCarrier & VersionedCarrier;
};

/**
 * Takes care of injecting spotlight-specific behavior into the Sentry SDK by
 * accessing the global __SENTRY__ carrier object.
 *
 * This is admittedly extremely hacky but it's the only way to hook into the SDK
 * without requiring users to manually register a spotlight integration or unnecessarily
 * increasing production build bundle size.
 *
 * Specifically, we:
 * - Enable SDK integrations if the SDK is configured without a DSN or disabled. This way, we
 *   can still capture events _only_ for spotlight
 * - Add a spotlight Sentry integration to the SDK that forwards events to the
 *   the spotlight sidecar ({@link spotlightIntegration})
 *
 * @param options options of the Sentry integration for Spotlight
 */
function addSpotlightIntegrationToSentry(options: SentryIntegrationOptions, sidecarUrl?: string) {
  if (options.injectIntoSDK === false) {
    return;
  }

  const sentryCarrier = (window as WindowWithSentry).__SENTRY__;
  const sentryClient = sentryCarrier && getSentryClient(sentryCarrier);

  if (!sentryClient) {
    log("Couldn't find a Sentry SDK client. Make sure you're using a Sentry SDK with version >=7.99.0 or 8.x");
    if (options.retries) {
      log(`Will retry ${options.retries} more time(s) at 100ms intervals...`);
      options.retries--;
      setTimeout(() => {
        addSpotlightIntegrationToSentry(options, sidecarUrl);
      }, 500);
    }
    return;
  }

  if (!sentryClient.getDsn()) {
    log("Sentry SDK doesn't have a valid DSN. Enabling SDK integrations for just Spotlight.");
    try {
      const sentryIntegrations = sentryClient.getOptions().integrations;
      for (const i of sentryIntegrations) {
        sentryClient.addIntegration(i);
      }
    } catch (e) {
      warn('Failed to enable all SDK integrations for Spotlight', e);
      log('Please open an issue with the error at: https://github.com/getsentry/spotlight/issues/new/choose');
    }
  }

  // HACK: Force enable transactions for this session and disable the existing DSN
  // @ts-ignore
  sentryClient._dsn = undefined;
  // @ts-ignore
  if (!sentryClient._options) {
    // @ts-ignore
    sentryClient._options = {};
  }
  // @ts-ignore
  sentryClient._options.tracesSampler = () => 1;
  // @ts-ignore
  sentryClient._options.sampleRate = 1;
  // TODO:  Enable profiling and set sample rate to 1 for that too

  try {
    // @ts-expect-error ts(2339) -- We're accessing a private property here
    const existingIntegration = Object.keys(sentryClient._integrations).find(i => /spotlight/i.test(i));
    if (existingIntegration) {
      log(
        `Skipping adding integration as there's already a Spotlight integration enabled in Sentry SDK: ${existingIntegration}`,
      );
      return;
    }
    sentryClient.addIntegration(spotlightIntegration());
    sentryClient.addIntegration(spotlightBrowserIntegration({ sidecarUrl }));
  } catch (e) {
    warn('Failed to add Spotlight integration to Sentry', e);
    log('Please open an issue with the error at: https://github.com/getsentry/spotlight/issues/new/choose');
  }

  log('Added Spotlight integration to Sentry SDK');
}

/**
 * Accesses the `window.__SENTRY__` carrier object and tries to get the Sentry client
 * from it. This function supports all carrier object structures from v7 to all versions
 * of v8.
 */
function getSentryClient(sentryCarrier: LegacyCarrier & VersionedCarrier): Client | undefined {
  // 8.6.0+ way to get the client
  if (sentryCarrier.version) {
    const versionedCarrier = sentryCarrier[sentryCarrier.version];
    const scope =
      typeof versionedCarrier?.stack?.getScope === 'function' ? versionedCarrier?.stack?.getScope?.() : undefined;
    if (typeof scope?.getClient === 'function') {
      return scope.getClient();
    }
  }

  // pre-8.6.0 (+v7) way to get the client
  if (sentryCarrier.hub) {
    const hub = sentryCarrier.hub;
    if (typeof hub.getClient === 'function') {
      return hub.getClient();
    }
  }

  return undefined;
}
