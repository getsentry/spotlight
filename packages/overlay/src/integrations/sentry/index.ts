import type { Envelope } from '@sentry/types';
import { getSpotlightEventTarget } from '../../lib/eventTarget';
import { log, warn } from '../../lib/logger';
import type { Integration, RawEventContext } from '../integration';
import sentryDataCache from './data/sentryDataCache';
import { Spotlight } from './sentry-integration';
import DeveloperInfo from './tabs/DeveloperInfo';
import ErrorsTab from './tabs/ErrorsTab';
import InfoTab from './tabs/InfoTab';
import PerformanceTab from './tabs/PerformanceTab';
import SdksTab from './tabs/SdksTab';
import TracesTab from './tabs/TracesTab';
import { WindowWithSentry } from './types';
import { checkBrowserSDKVersion } from './utils/sdkValidation';

const HEADER = 'application/x-sentry-envelope';

type SentryIntegrationOptions = {
  sidecarUrl?: string;
  injectIntoSDK?: boolean;
};

export default function sentryIntegration(options?: SentryIntegrationOptions) {
  if (checkBrowserSDKVersion()) {
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
              (e.contexts?.trace?.trace_id ? sentryDataCache.isTraceLocal(e.contexts?.trace?.trace_id) : null) !==
                false,
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
  } else {
    warn(`This version of Spotlight supports Sentry browser SDK version less than 8.x.x. Check out Spotlight v2.x.x`);
    return {
      name: 'sentry',
      forwardedContentType: [],
      setup: () => {},
      processEvent: () => undefined,
      tabs: () => {
        return [
          {
            id: 'info',
            title: 'Info',
            content: () =>
              InfoTab({
                info: 'This version of Spotlight supports Sentry browser SDK version less than 8.x.x. Check out Spotlight v2.x.x',
              }),
          },
        ];
      },
      reset: () => {},
    } satisfies Integration<Envelope>;
  }
}

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
    let payload;
    try {
      payload = JSON.parse(rawEntries[i + 1]);
    } catch (e) {
      // payload will not be json always, like in metrics events.
      log(e);
      payload = rawEntries[i + 1];
    }
    // data sanitization
    if (header.type && typeof payload === 'object') {
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
