import type { Envelope } from '@sentry/types';
import { getSpotlightEventTarget } from '../../lib/eventTarget';
import { log } from '../../lib/logger';
import type { Integration, RawEventContext } from '../integration';
import sentryDataCache from './data/sentryDataCache';
import { Spotlight } from './sentry-integration';
import ErrorsTab from './tabs/ErrorsTab';
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
            count: sentryDataCache.getTraces().filter(t => sentryDataCache.isTraceLocal(t.trace_id) !== false).length,
          },
          content: TracesTab,
        },
        {
          id: 'sdks',
          title: 'SDKs',
          content: SdksTab,
        },
      ];
    },
  } satisfies Integration<Envelope>;
}

type WindowWithSentry = Window & {
  __SENTRY__?: {
    hub: {
      getClient: () =>
        | {
            setupIntegrations: (force: boolean) => void;
            addIntegration(integration: Integration): void;
            on: (event: string, callback: (envelope: Envelope) => void) => void;
          }
        | undefined;
    };
  };
};

export function processEnvelope({ data }: RawEventContext) {
  const [rawHeader, ...rawEntries] = data.split(/\n/gm);

  const header = JSON.parse(rawHeader) as Envelope[0];
  const items: Envelope[1][] = [];
  for (let i = 0; i < rawEntries.length; i += 2) {
    // guard both rawEntries[i] and rawEntries[i + 1] are defined and not empty
    if (!rawEntries[i] || !rawEntries[i + 1]) {
      continue;
    }
    const header = JSON.parse(rawEntries[i]);
    const payload = JSON.parse(rawEntries[i + 1]);
    // data sanitization
    if (header.type) {
      payload.type = header.type;
    }
    items.push([header, payload]);
  }

  const envelope = [header, items] as Envelope;
  sentryDataCache.pushEnvelope(envelope);

  return {
    event: envelope,
  };
}

function addSpotlightIntegrationToSentry(options?: SentryIntegrationOptions) {
  if (options?.injectIntoSDK === false) return;
  // A very hacky way to hook into Sentry's SDK
  // but we love hacks
  const sentryHub = (window as WindowWithSentry).__SENTRY__?.hub;
  const sentryClient = sentryHub?.getClient();
  if (sentryClient) {
    const spotlightIntegration = new Spotlight({
      sidecarUrl: options?.sidecarUrl,
    });
    sentryClient.addIntegration(spotlightIntegration);
  }
}
