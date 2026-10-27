import type { Envelope } from "@sentry/core";
import { CONTEXT_LINES_ENDPOINT } from "@spotlight/shared/constants.ts";
import { DEFAULT_SIDECAR_URL } from "@spotlight/ui/constants";
import { useStore } from "zustand";
import { createIngester } from "../../../sdk/core.ts";
import type { IngestResult, IngesterSnapshot } from "../../../sdk/core.ts";
import type { SentryStore, SentryStoreState, Subscription } from "../../../telemetry/store/types.ts";
import { getNativeFetchImplementation } from "../utils/fetch";

let contextLinesProvider = new URL(CONTEXT_LINES_ENDPOINT, DEFAULT_SIDECAR_URL).href;
export function setTelemetrySidecarUrl(url: string) {
  contextLinesProvider = new URL(CONTEXT_LINES_ENDPOINT, url).href;
}

const spotlight = createIngester({
  enrichStacktrace: async event => {
    await Promise.all(
      (event.exception?.values ?? []).map(async exception => {
        const frames = exception.stacktrace?.frames;
        if (!frames || frames.every(frame => frame.post_context && frame.pre_context && frame.context_line)) return;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await getNativeFetchImplementation()(contextLinesProvider, {
            method: "PUT",
            body: JSON.stringify(exception.stacktrace),
            signal: controller.signal,
          });
          if (response.status === 200) exception.stacktrace = await response.json();
        } catch {
          // Optional context must not prevent sibling exceptions from finishing enrichment.
        } finally {
          clearTimeout(timeout);
        }
      }),
    );
  },
});

type UiState = SentryStoreState &
  Pick<
    SentryStore,
    | "getEventById"
    | "getTraceById"
    | "getEventsByTrace"
    | "getEvents"
    | "getTraces"
    | "getLogs"
    | "getLogById"
    | "getLogsByTraceId"
    | "getProfileByTraceId"
    | "getAggregateCallData"
    | "getEnvelopeById"
    | "getEnvelopes"
    | "getSdks"
    | "resetData"
    | "subscribe"
  > & {
    pushEnvelope: (input: unknown) => Promise<IngestResult>;
    ingestEnvelope: (input: unknown) => Promise<IngestResult>;
  };

// Only this adapter translates the historical UI vocabulary. The SDK never exposes these actions.
const subscribers = new Map<string, Subscription>();
const actions = {
  getEventById: spotlight.getEvent,
  getTraceById: spotlight.getTrace,
  getEventsByTrace: (traceId: string, spanId?: string | null) => [
    ...spotlight.getEvents({ traceId, ...(spanId == null ? {} : { spanId }) }),
  ],
  getEvents: () => [...spotlight.getEvents()],
  getTraces: () => [...spotlight.getTraces()],
  getLogs: () => [...spotlight.getLogs()],
  getLogById: spotlight.getLog,
  getLogsByTraceId: (traceId: string) => [...spotlight.getLogs({ traceId })],
  getProfileByTraceId: spotlight.getProfile,
  getAggregateCallData: () =>
    spotlight.getProfileFunctionSummaries().map(summary => ({
      name: summary.name,
      totalTime: summary.totalDurationMs,
      samples: summary.sampleCount,
      traceIds: new Set(summary.traceIds),
    })),
  getEnvelopeById: spotlight.getEnvelope,
  getEnvelopes: () => [...spotlight.getEnvelopes()] as Envelope[],
  getSdks: () => [...spotlight.getSdks()],
  resetData: spotlight.reset,
  pushEnvelope: spotlight.ingestEnvelope,
  ingestEnvelope: spotlight.ingestEnvelope,
  subscribe: (...subscription: Subscription) => {
    const id = crypto.randomUUID();
    subscribers.set(id, subscription);
    return () => {
      subscribers.delete(id);
    };
  },
};
function view(snapshot: IngesterSnapshot): UiState {
  const logsByTraceId = new Map<string, Set<IngesterSnapshot["logs"][number]>>();
  for (const log of snapshot.logs) {
    if (!log.trace_id) continue;
    const group = logsByTraceId.get(log.trace_id) ?? new Set();
    group.add(log);
    logsByTraceId.set(log.trace_id, group);
  }
  return {
    eventsById: new Map(snapshot.events.map(event => [event.event_id, event])),
    tracesById: new Map(snapshot.traces.map(trace => [trace.trace_id, trace])),
    logsById: new Map(snapshot.logs.map(log => [log.id, log])),
    logsByTraceId,
    envelopes: new Map(snapshot.envelopes.map(envelope => [String(envelope[0].__spotlight_envelope_id), envelope])),
    sdks: new Map(snapshot.sdks.map(sdk => [`${sdk.name}@${sdk.version}`, sdk])),
    profilesByTraceId: new Map(snapshot.profiles),
    profileChunksByProfilerId: new Map(),
    subscribers,
    ...actions,
  } as unknown as UiState;
}
let current = view(spotlight.getSnapshot());
const initial = current;
const listeners = new Set<(state: UiState, previous: UiState) => void>();
spotlight.subscribe(snapshot => {
  const previous = current;
  current = view(snapshot);
  for (const listener of listeners) listener(current, previous);
  for (const event of snapshot.events) {
    if (event.event_id && previous.eventsById.has(event.event_id)) continue;
    for (const [type, callback] of subscribers.values()) {
      if (type === "event") callback(event as Parameters<typeof callback>[0]);
      if (spotlight.getSnapshot() !== snapshot) return;
    }
  }
});
const adapter = {
  getState: () => current,
  getInitialState: () => initial,
  subscribe: (listener: (state: UiState, previous: UiState) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
function useTelemetryStore<T = UiState>(
  selector: (state: UiState) => T = (state => state) as (state: UiState) => T,
): T {
  return useStore(adapter, selector);
}
const useSentryStore = Object.assign(useTelemetryStore, adapter);
export default useSentryStore;
