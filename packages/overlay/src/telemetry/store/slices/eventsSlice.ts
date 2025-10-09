import type { StateCreator } from "zustand";
import { generateUuidv4 } from "~/lib/uuid";
import { graftProfileSpans } from "../../data/profiles";
import type {
  ProfileSample,
  SentryEvent,
  SentryLogEventItem,
  SentryProfileTransactionInfo,
  SentryTransactionEvent,
  Span,
} from "../../types";
import { isErrorEvent, isLogEvent, isProfileEvent, isTraceEvent } from "../../utils/sentry";
import { compareSpans, groupSpans } from "../../utils/traces";
import type { EventsSliceActions, EventsSliceState, SentryStore } from "../types";
import { relativeNsToTimestamp, toTimestamp } from "../utils";

const initialEventsState: EventsSliceState = {
  eventsById: new Map(),
};

export const createEventsSlice: StateCreator<SentryStore, [], [], EventsSliceState & EventsSliceActions> = (
  set,
  get,
) => ({
  ...initialEventsState,
  pushEvent: async (event: SentryEvent & { event_id?: string }) => {
    if (!event.event_id) {
      event.event_id = generateUuidv4();
    }

    const { eventsById } = get();
    if (eventsById.has(event.event_id)) return;

    if (isErrorEvent(event)) {
      await get().processStacktrace(event);
    }

    if (event.timestamp) {
      event.timestamp = toTimestamp(event.timestamp);
    }
    if (event.start_timestamp) {
      event.start_timestamp = toTimestamp(event.start_timestamp);
    }

    if (isLogEvent(event) && event.items?.length) {
      const { logsById, logsByTraceId } = get();
      for (const logItem of event.items) {
        const logId = logItem.id || generateUuidv4();
        if (logsById.has(logId)) {
          continue;
        }
        if (logItem.severity_number == null) {
          logItem.severity_number = 0;
        }
        logItem.sdk = logItem.attributes?.["sentry.sdk.name"]?.value as string;
        logItem.timestamp = toTimestamp(logItem.timestamp);
        logItem.id = logId;

        const newLogsById = new Map(logsById);
        newLogsById.set(logItem.id, logItem);
        set({ logsById: newLogsById });

        if (logItem.trace_id) {
          const newLogsByTraceId = new Map(logsByTraceId);
          const logSet = newLogsByTraceId.get(logItem.trace_id) || new Set<SentryLogEventItem>();
          logSet.add(logItem);
          newLogsByTraceId.set(logItem.trace_id, logSet);
          set({ logsByTraceId: newLogsByTraceId });
        }
      }
    }

    const newEventIds = new Map(eventsById);
    newEventIds.set(event.event_id, event);
    set({ eventsById: newEventIds });

    // Notify event subscribers
    for (const [type, callback] of get().subscribers.values()) {
      if (type === "event") {
        (callback as (event: SentryEvent) => void)(event);
      }
    }

    const traceCtx = event.contexts?.trace;
    if (traceCtx?.trace_id) {
      const { tracesById } = get();
      const existingTrace = tracesById.get(traceCtx.trace_id);
      const trace = existingTrace ?? {
        ...traceCtx,
        trace_id: traceCtx.trace_id,
        spans: new Map(),
        spanTree: [] as Span[],
        transactions: [] as SentryTransactionEvent[],
        errors: 0,
        start_timestamp: event.start_timestamp ?? event.timestamp,
        timestamp: event.timestamp,
        status: traceCtx.status,
        rootTransactionName: event.transaction || "(unknown transaction)",
        rootTransaction: null,
        profileGrafted: false,
      };
      trace.start_timestamp = Math.min(event.start_timestamp ?? event.timestamp, trace.start_timestamp);
      trace.timestamp = Math.max(event.timestamp, trace.timestamp);

      if (isTraceEvent(event)) {
        trace.transactions.push(event);
        trace.transactions.sort(compareSpans);

        // recompute tree as we might have txn out of order
        // XXX: we're trusting timestamps, which may not be as reliable as we'd like
        const spanMap: Map<string, Span> = new Map();
        for (const txn of trace.transactions) {
          const trace = txn.contexts.trace;
          if (!trace || !trace.span_id || !trace.trace_id) {
            continue;
          }

          spanMap.set(trace.span_id, {
            ...trace,
            // TypeScript is not smart enough to compose the assertion above
            // with the spread syntax above, hence the need for these explicit
            // `span_id` and `trace_id` assignments
            span_id: trace.span_id,
            trace_id: trace.trace_id,
            tags: txn?.tags,
            start_timestamp: txn.start_timestamp,
            timestamp: txn.timestamp,
            description: traceCtx.description || txn.transaction,
            transaction: txn,
          });

          if (txn.spans) {
            for (const span of txn.spans) {
              spanMap.set(span.span_id, {
                ...span,
                timestamp: toTimestamp(span.timestamp),
                start_timestamp: toTimestamp(span.start_timestamp),
              });
            }
          }
        }
        trace.spans = spanMap;
        trace.spanTree = groupSpans(trace.spans);
        graftProfileSpans(trace);
      } else if (isErrorEvent(event)) {
        trace.errors += 1;
      }
      if (traceCtx.status !== "ok") trace.status = traceCtx.status;

      const roots = trace.transactions.filter(e => !e.contexts.trace.parent_span_id);
      if (roots.length === 1) {
        trace.rootTransaction = roots[0];
        trace.rootTransactionName = roots[0].transaction || "(unknown transaction)";
      } else if (roots.length > 1) trace.rootTransactionName = "(multiple root transactions)";
      else trace.rootTransactionName = "(missing root transaction)";

      if (!existingTrace) {
        const newTracesById = new Map(tracesById);
        newTracesById.set(trace.trace_id, trace);
        set({
          tracesById: newTracesById,
        });
      }
    }

    if (isProfileEvent(event)) {
      if (!event.transactions) {
        event.transactions = event.transaction ? [event.transaction] : [];
      }
      const { profilesByTraceId, tracesById } = get();
      const newProfilesByTraceId = new Map(profilesByTraceId);

      for (const txn of event.transactions) {
        if (typeof txn === "string") continue; // Skip if it's just a string transaction ID
        const profileTxn = txn as SentryProfileTransactionInfo;
        const trace = tracesById.get(profileTxn.trace_id);
        const timestamp =
          trace && profileTxn.relative_start_ns != null
            ? relativeNsToTimestamp(trace.start_timestamp, profileTxn.relative_start_ns)
            : event.timestamp;

        const profile = {
          platform: event.platform,
          thread_metadata: event.profile.thread_metadata,
          samples: event.profile.samples.map((s: ProfileSample) => ({
            stack_id: s.stack_id,
            thread_id: s.thread_id,
            elapsed_since_start_ns: s.elapsed_since_start_ns,
            start_timestamp: relativeNsToTimestamp(timestamp, s.elapsed_since_start_ns),
          })),
          frames: event.profile.frames,
          stacks: event.profile.stacks.map(s => Array.from(s).reverse()),
          timestamp,
          active_thread_id: profileTxn.active_thread_id,
        };
        newProfilesByTraceId.set(profileTxn.trace_id, profile);
        // Avoid grafting partial traces (where we mocked start_timestamp from the event's timestamp)
        // These should get grafted once we get the full trace data later on
        if (trace && trace.start_timestamp < trace.timestamp) {
          graftProfileSpans(trace, profile);
        }
      }
      set({ profilesByTraceId: newProfilesByTraceId });
    }
  },
  getEvents: () => Array.from(get().eventsById.values()),
});
