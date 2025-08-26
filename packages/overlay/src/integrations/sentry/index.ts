import type { Client, Envelope } from "@sentry/core";
import { removeURLSuffix } from "~/lib/removeURLSuffix";
import { off, on } from "../../lib/eventTarget";
import { log, warn } from "../../lib/logger";
import type { Integration } from "../integration";
import { spotlightIntegration } from "./sentry-integration";
import useSentryStore from "./store";
import ErrorsTab from "./tabs/ErrorsTab";
import InsightsTab from "./tabs/InsightsTab";

import { spotlightBrowserIntegration } from "@sentry/browser";
import {
  type RawEventContext,
  type SentryErrorEvent,
  type SentryEvent,
  isErrorEvent,
  processEnvelope,
} from "@spotlightjs/core/sentry";
import { getLocalTraces, isLocalTrace } from "./store/helpers";
import LogsTab from "./tabs/LogsTab";
import TracesTab from "./tabs/TracesTab";
import { createTab } from "./utils/tabs";

const HEADER = "application/x-sentry-envelope";

type SentryIntegrationOptions = {
  injectIntoSDK?: boolean;
  openLastError?: boolean;
  retries?: number;
};

export default function sentryIntegration(options: SentryIntegrationOptions = {}) {
  return {
    name: "sentry",
    forwardedContentType: [HEADER],

    setup: ({ open, sidecarUrl }) => {
      if (options.retries == null) {
        options.retries = 10;
      }
      const store = useSentryStore.getState();
      let baseSidecarUrl: string | undefined = undefined;
      if (sidecarUrl) {
        baseSidecarUrl = removeURLSuffix(sidecarUrl, "/stream");
        store.setSidecarUrl(baseSidecarUrl);
      }

      log("Setting up Sentry integration for Spotlight");
      addSpotlightIntegrationToSentry(options, baseSidecarUrl && new URL("/stream", baseSidecarUrl).href);

      if (options.openLastError) {
        store.subscribe("event", (e: SentryEvent) => {
          if (!(e as SentryErrorEvent).exception) return;
          setTimeout(() => open(`/errors/${e.event_id}`), 0);
        });
      }

      const onRenderError = (e: CustomEvent) => {
        log("Sentry Event", e.detail.event_id);
        if (!e.detail.event) return;
        store.pushEvent(e.detail.event).then(() => open(`/errors/${e.detail.event.event_id}`));
      };

      on("sentry:showError", onRenderError as EventListener);

      return () => {
        off("sentry:showError", onRenderError as EventListener);
      };
    },

    processEvent: (event: RawEventContext) => handleProcessEnvelope(event),

    panels: () => {
      const store = useSentryStore.getState();

      const errorCount = store
        .getEvents()
        .reduce(
          (sum, e) =>
            sum +
            Number(
              isErrorEvent(e) &&
                (e.contexts?.trace?.trace_id ? isLocalTrace(e.contexts?.trace?.trace_id) : null) !== false,
            ),
          0,
        );

      const localTraceCount = getLocalTraces().length;

      return [
        createTab("traces", "Traces", {
          notificationCount: {
            count: localTraceCount,
          },
          content: TracesTab,
        }),
        createTab("errors", "Errors", {
          notificationCount: {
            count: errorCount,
            severe: errorCount > 0,
          },
          content: ErrorsTab,
        }),
        createTab("logs", "Logs", {
          content: LogsTab,
        }),
        createTab("insights", "Insights", {
          content: InsightsTab,
          panels: () => [
            createTab("queries", "Queries"),
            createTab("webvitals", "Web Vitals"),
            createTab("resources", "Resources"),
            createTab("profiles", "Profiles"),
            createTab("envelopes", "Envelopes"),
            createTab("sdks", "SDKs"),
            createTab("aitraces", "AI Traces"),
          ],
        }),
      ];
    },

    reset: () => {
      useSentryStore.getState().resetData();
    },
  } satisfies Integration<Envelope>;
}

export function handleProcessEnvelope(_event: RawEventContext) {
  const { event, rawEvent } = processEnvelope(_event);
  useSentryStore.getState().pushEnvelope({ envelope: event, rawEnvelope: rawEvent });
  return { rawEvent, event };
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

type VersionedCarrier = { version: string } & Record<Exclude<string, "version">, V8Carrier>;

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
      warn("Failed to enable all SDK integrations for Spotlight", e);
      log("Please open an issue with the error at: https://github.com/getsentry/spotlight/issues/new/choose");
    }

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
  } else {
    log("Sentry SDK has a DSN set so did not alter any options. You might be missing some traces, errors, or data.");
  }

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
    warn("Failed to add Spotlight integration to Sentry", e);
    log("Please open an issue with the error at: https://github.com/getsentry/spotlight/issues/new/choose");
  }

  log("Added Spotlight integration to Sentry SDK");
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
      typeof versionedCarrier?.stack?.getScope === "function" ? versionedCarrier?.stack?.getScope?.() : undefined;
    if (typeof scope?.getClient === "function") {
      return scope.getClient();
    }
  }

  // pre-8.6.0 (+v7) way to get the client
  if (sentryCarrier.hub) {
    const hub = sentryCarrier.hub;
    if (typeof hub.getClient === "function") {
      return hub.getClient();
    }
  }

  return undefined;
}
