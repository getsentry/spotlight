import type { Envelope } from '@sentry/types';

import type { Integration, RawEventContext, Severity } from '../integration';

import sentryDataCache from './data/sentryDataCache';
import { Spotlight } from './sentry-integration';
import ErrorsTab from './tabs/ErrorsTab';
import SdksTab from './tabs/SdksTab';
import TracesTab from './tabs/TracesTab';

const HEADER = 'application/x-sentry-envelope';

export default function sentryIntegration() {
  console.log('spotlight', sentryDataCache.getEvents());

  return {
    name: 'sentry',
    forwardedContentType: [HEADER],

    setup: () => {
      addSpotlightIntegrationToSentry();
    },

    processEvent: (event: RawEventContext) => processEnvelope(event),

    tabs: () => [
      {
        id: 'errors',
        title: 'Errors',
        notificationCount: sentryDataCache.getEvents().filter(e => !e.type).length,
        content: ErrorsTab,
      },
      {
        id: 'traces',
        title: 'Traces',
        notificationCount: sentryDataCache.getTraces().length,
        content: TracesTab,
      },
      {
        id: 'sdks',
        title: 'SDKs',
        content: SdksTab,
      },
    ],
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
  console.log('[Spotlight] Received new envelope');

  const [rawHeader, ...rawEntries] = data.split(/\n/gm);
  const header = JSON.parse(rawHeader) as Envelope[0];
  console.log(`[Spotlight] Received new envelope from SDK ${header.sdk?.name || '(unknown)'}`);

  const items: Envelope[1][] = [];
  for (let i = 0; i < rawEntries.length; i += 2) {
    console.log(rawEntries[i + 1]);
    items.push([JSON.parse(rawEntries[i]), JSON.parse(rawEntries[i + 1])]);
  }

  const envelope = [header, items] as Envelope;
  sentryDataCache.pushEnvelope(envelope);

  return {
    event: envelope,
    severity: isErrorEnvelope(envelope) ? 'severe' : ('default' as Severity),
  };
}

function isErrorEnvelope(envelope: Envelope) {
  return envelope[1].some(([itemHeader]) => itemHeader.type === 'event');
}

function addSpotlightIntegrationToSentry() {
  // A very hacky way to hook into Sentry's SDK
  // but we love hacks
  const sentryHub = (window as WindowWithSentry).__SENTRY__?.hub;
  const sentryClient = sentryHub?.getClient();
  if (sentryClient) {
    sentryClient.addIntegration(new Spotlight());
  }
}
