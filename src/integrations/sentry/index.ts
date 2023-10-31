import type { Envelope } from '@sentry/types';
import { serializeEnvelope } from '@sentry/utils';

import type { Integration } from '../integration';

import sentryDataCache from './data/sentryDataCache';
import ErrorsTab from './tabs/ErrorsTab';
import TracesTab from './tabs/TracesTab';
import SdksTab from './tabs/SdksTab';

const HEADER = 'application/x-sentry-envelope';

export default function sentryIntegration() {
  return {
    name: 'sentry',
    forwardedContentType: [HEADER],

    setup: () => {
      hookIntoSentry();
    },

    processEvent({ data }) {
      console.log('[spotlight] Received new envelope');
      const [rawHeader, ...rawEntries] = data.split('\n');
      const header = JSON.parse(rawHeader) as Envelope[0];
      console.log(`[Spotlight] Received new envelope from SDK ${header.sdk?.name || '(unknown)'}`);

      const items: Envelope[1][] = [];
      for (let i = 0; i < rawEntries.length; i += 2) {
        items.push([JSON.parse(rawEntries[i]), JSON.parse(rawEntries[i + 1])]);
      }

      const envelope = [header, items] as Envelope;
      sentryDataCache.pushEnvelope(envelope);

      return envelope;
    },
    tabs: [
      {
        id: 'errors',
        title: 'Errors',
        content: ErrorsTab,
      },
      {
        id: 'traces',
        title: 'Traces',
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
      _stack: {
        client: {
          setupIntegrations: (val: boolean) => void;
          on: (event: string, callback: (envelope: Envelope) => void) => void;
        };
      }[];
    };
  };
};

function hookIntoSentry() {
  // A very hacky way to hook into Sentry's SDK
  // but we love hacks
  const sentryHub = (window as WindowWithSentry).__SENTRY__?.hub;
  const sentryClient = sentryHub?._stack[0]?.client;

  sentryClient?.setupIntegrations(true);
  sentryClient?.on('beforeEnvelope', (envelope: Envelope) => {
    fetch('http://localhost:8969/stream', {
      method: 'POST',
      body: serializeEnvelope(envelope),
      headers: {
        'Content-Type': HEADER,
      },
      mode: 'cors',
    }).catch(err => {
      console.error(err);
    });
  });
}
