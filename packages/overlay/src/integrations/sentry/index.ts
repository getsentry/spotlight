import type { Client, Envelope } from '@sentry/types';
import { getSpotlightEventTarget } from '../../lib/eventTarget';
import { log, warn } from '../../lib/logger';
import type { Integration, RawEventContext } from '../integration';
import sentryDataCache from './data/sentryDataCache';
import { spotlightIntegration } from './sentry-integration';
import DeveloperInfo from './tabs/DeveloperInfo';
import ErrorsTab from './tabs/ErrorsTab';
import PerformanceTab from './tabs/PerformanceTab';
import SdksTab from './tabs/SdksTab';
import TracesTab from './tabs/TracesTab';

const HEADER = 'application/x-sentry-envelope';

type SentryIntegrationOptions = {
  sidecarUrl?: string;
  injectIntoSDK?: boolean;
};

export default function sentryIntegration(options?: SentryIntegrationOptions) {
  return {
    name: 'sentry',
    forwardedContentType: [HEADER],

    setup: ({ open }) => {
      addSpotlightIntegrationToSentry(options);

      const spotlightEventTarget = getSpotlightEventTarget();

      const onRenderError = (e: CustomEvent) => {
        log('Sentry Event', e.detail.event_id);
        if (e.detail.event) sentryDataCache.pushEvent(e.detail.event);
        // TODO: handle async
        open(`/errors/${e.detail.eventId}`);
      };

      spotlightEventTarget.addEventListener('sentry:showError', onRenderError as EventListener);

      return () => {
        spotlightEventTarget.removeEventListener('sentry:showError', onRenderError as EventListener);
      };
    },

    processEvent: (event: RawEventContext) => processEnvelope(event),

    tabs: () => {
      const errorsCount = sentryDataCache
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
            count: errorsCount,
            severe: errorsCount > 0,
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

type WindowWithSentry = Window & {
  __SENTRY__?: {
    /** Future-proof v8 way of accessing Sentry APIs via the global */
    acs?: {
      getCurrentScope: () => {
        getClient: () => Client | undefined;
      };
    };
    hub?: {
      getClient: () => Client | undefined;
    };
  };
};

export function processEnvelope(rawEvent: RawEventContext) {
  const { data } = rawEvent;
  const [rawHeader, ...rawEntries] = data.split(/\n/gm);

  const header = JSON.parse(rawHeader) as Envelope[0];
  const items: Envelope[1][] = [];
  for (let i = 0; i < rawEntries.length; i += 2) {
    // guard both rawEntries[i] and rawEntries[i + 1] are defined and not empty
    if (!rawEntries[i] || !rawEntries[i + 1]) {
      continue;
    }
    const header = JSON.parse(rawEntries[i]);
    if (header.type && header.type == 'statsd') {
      // skip metric events
      continue;
    }
    const payload = JSON.parse(rawEntries[i + 1]);
    // data sanitization
    if (header.type) {
      payload.type = header.type;
    }
    items.push([header, payload]);
  }

  const envelope = [header, items] as Envelope;
  sentryDataCache.pushEnvelope({ envelope, rawEnvelope: rawEvent });

  return {
    event: envelope,
    rawEvent: rawEvent,
  };
}

/**
 * Takes care of injecting spotlight-specific behavior into the Sentry SDK by
 * accessing the global __SENTRY__ carrier object.
 *
 * This is admittedly extremely hacky but it's the only way to hook into the SDK
 * without requiring users to manually register a spotlight integration or unnecessarily
 * increasing production build bundle size.
 *
 * Specifically, we:
 * - Enable SDK integrations if the SDK is configured without a DSN. This way, we
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

  const sentryGlobal =
    // This is what we expect the v8-stable accessor to be
    (window as WindowWithSentry).__SENTRY__?.acs?.getCurrentScope() ||
    // This is the current accessor (v7 and v8-alpha)
    (window as WindowWithSentry).__SENTRY__?.hub;

  if (!sentryGlobal) {
    warn("Couldn't find the Sentry SDK on this page. Make sure you're using a Sentry SDK with version 8.0.0 or higher");
    return;
  }

  const sentryClient = sentryGlobal.getClient();
  if (!sentryClient) {
    warn("Couldn't find a Sentry SDK client. Make sure you're using a Sentry SDK with version 8.0.0 or higher");
    return;
  }

  if (!sentryClient.getOptions().dsn) {
    log('Sentry SDK is configured without a DSN. Enabling SDK integrations for Spotlight.');
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
