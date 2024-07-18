import type { Client, Envelope, EnvelopeItem } from '@sentry/types';
import { off, on } from '../../lib/eventTarget';
import { log, warn } from '../../lib/logger';
import type { Integration, RawEventContext } from '../integration';
import sentryDataCache from './data/sentryDataCache';
import { spotlightIntegration } from './sentry-integration';
import DeveloperInfo from './tabs/DeveloperInfo';
import ErrorsTab from './tabs/ErrorsTab';
import PerformanceTab from './tabs/PerformanceTab';
import SdksTab from './tabs/SdksTab';
import TracesTab from './tabs/TracesTab';
import type { SentryErrorEvent, SentryEvent } from './types';

const HEADER = 'application/x-sentry-envelope';

type SentryIntegrationOptions = {
  sidecarUrl?: string;
  injectIntoSDK?: boolean;
  openLastError?: boolean;
};

export default function sentryIntegration(options?: SentryIntegrationOptions) {
  return {
    name: 'sentry',
    forwardedContentType: [HEADER],

    setup: ({ open }) => {
      addSpotlightIntegrationToSentry(options);

      if (options?.openLastError) {
        sentryDataCache.subscribe('event', (e: SentryEvent) => {
          if (!(e as SentryErrorEvent).exception) return;
          setTimeout(() => open(`/errors/${e.event_id}`), 0);
        });
      }

      const onRenderError = (e: CustomEvent) => {
        log('Sentry Event', e.detail.event_id);
        if (!e.detail.event) return;
        sentryDataCache.pushEvent(e.detail.event).then(() => {
          open(`/errors/${e.detail.event.event_id}`);
        });
      };

      on('sentry:showError', onRenderError as EventListener);

      return () => {
        off('sentry:showError', onRenderError as EventListener);
      };
    },

    processEvent: (event: RawEventContext) => processEnvelope(event),

    tabs: () => {
      const errorCount = sentryDataCache
        .getEvents()
        .filter(
          e =>
            e.type != 'transaction' &&
            (e.contexts?.trace?.trace_id ? sentryDataCache.isTraceLocal(e.contexts?.trace?.trace_id) : null) !== false,
        ).length;
      const localTraces = sentryDataCache.getTraces().filter(t => sentryDataCache.isTraceLocal(t.trace_id) !== false);

      return [
        {
          id: 'errors',
          title: 'Errors',
          notificationCount: {
            count: errorCount,
            severe: errorCount > 0,
          },
          content: ErrorsTab,
        },
        {
          id: 'traces',
          title: 'Traces',
          notificationCount: {
            count: localTraces.length,
          },
          content: TracesTab,
        },
        {
          id: 'performance',
          title: 'Performance',
          content: PerformanceTab,
        },
        {
          id: 'sdks',
          title: 'SDKs',
          content: SdksTab,
        },
        {
          id: 'devInfo',
          title: 'Developer Info',
          content: DeveloperInfo,
        },
      ];
    },

    reset: () => {
      sentryDataCache.resetData();
    },
  } satisfies Integration<Envelope>;
}

function getLineEnd(data: string | Buffer, startFrom: number): number {
  let end = data.indexOf('\n', startFrom);
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
export async function processEnvelope(rawEvent: RawEventContext) {
  const { data } = rawEvent;
  let prevCursor = 0;
  let cursor = getLineEnd(data, prevCursor);
  const envelopeHeader = JSON.parse(data.slice(prevCursor, cursor).toString()) as Envelope[0];

  const items: EnvelopeItem[] = [];
  while (cursor < data.length - 1) {
    prevCursor = cursor + 1;
    cursor = getLineEnd(data, prevCursor);
    const itemHeader = JSON.parse(data.slice(prevCursor, cursor).toString()) as EnvelopeItem[0];
    prevCursor = cursor + 1;
    const payloadLength = itemHeader.length;
    if (payloadLength !== undefined) {
      cursor += payloadLength + 1;
    } else {
      cursor = getLineEnd(data, prevCursor);
    }
    let itemPayload = data.slice(prevCursor, cursor);

    try {
      itemPayload = JSON.parse(itemPayload.toString());
    } catch (err) {
      log(err);
    }

    // data sanitization
    if (itemHeader.type && typeof itemPayload === 'object') {
      // @ts-expect-error -- we should fix the types here
      itemPayload.type = itemHeader.type;
    }
    items.push([itemHeader, itemPayload] as EnvelopeItem);
  }

  const envelope = [envelopeHeader, items] as Envelope;
  await sentryDataCache.pushEnvelope({ envelope, rawEnvelope: rawEvent });

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
function addSpotlightIntegrationToSentry(options?: SentryIntegrationOptions) {
  if (options?.injectIntoSDK === false) {
    return;
  }

  const sentryCarrier = (window as WindowWithSentry).__SENTRY__;
  const sentryClient = sentryCarrier && getSentryClient(sentryCarrier);

  if (!sentryClient) {
    log("Couldn't find a Sentry SDK client. Make sure you're using a Sentry SDK with version >=7.99.0 or 8.x");
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

  try {
    const integration = spotlightIntegration({
      sidecarUrl: options?.sidecarUrl,
    });
    sentryClient.addIntegration(integration);
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
