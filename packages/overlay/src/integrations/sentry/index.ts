import type { Envelope } from '@sentry/types';

import type { Integration, RawEventContext, Severity } from '../integration';

import sentryDataCache from './data/sentryDataCache';
import { Spotlight } from './sentry-integration';
import ErrorsTab from './tabs/ErrorsTab';
import SdksTab from './tabs/SdksTab';
import TracesTab from './tabs/TracesTab';

const HEADER = 'application/x-sentry-envelope';

type SentryIntegrationOptions = {
  sidecarUrl?: string;
};

export default function sentryIntegration(options?: SentryIntegrationOptions) {
  return {
    name: 'sentry',
    forwardedContentType: [HEADER],

    setup: () => {
      addSpotlightIntegrationToSentry(options);
    },

    processEvent: (event: RawEventContext) => processEnvelope(event),

    tabs: () => [
      {
        id: 'errors',
        title: 'Errors',
        notificationCount: sentryDataCache.getEvents().filter(e => e.type != 'transaction').length,
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
    severity: isErrorEnvelope(envelope) ? 'severe' : ('default' as Severity),
  };
}

function isErrorEnvelope(envelope: Envelope) {
  return envelope[1].some(([itemHeader]) => itemHeader.type === 'event');
}

function addSpotlightIntegrationToSentry(options?: SentryIntegrationOptions) {
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
