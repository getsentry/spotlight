import { generateUuidv4 } from "@spotlight/ui/lib/uuid";
import type { StateCreator } from "zustand";
import type { SentryEvent, SentryLogEventItem } from "../../types";
import { isErrorEvent, isLogEvent, isProfileEvent, isTraceEvent } from "../../utils/sentry";
import type { EventsSliceActions, EventsSliceState, SentryStore } from "../types";
import { toTimestamp } from "../utils";
import { processLogItems } from "../utils/logProcessor";
import { processProfileEvent } from "../utils/profileProcessor";
import { initializeTrace } from "../utils/traceInitializer";
import { processTransactionEvent, updateTraceMetadata } from "../utils/traceProcessor";

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

    const { eventsById: _eventsById } = get();
    if (_eventsById.has(event.event_id)) return;

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
      const existingLogIds = new Set(logsById.keys());
      const { processedLogs } = processLogItems(event, existingLogIds);

      // Update store with processed logs
      // Build up the Maps incrementally to avoid stale state capture
      const newLogsById = new Map(logsById);
      const newLogsByTraceId = new Map(logsByTraceId);

      for (const logItem of processedLogs) {
        newLogsById.set(logItem.id, logItem);

        if (logItem.trace_id) {
          const logSet = newLogsByTraceId.get(logItem.trace_id) || new Set<SentryLogEventItem>();
          logSet.add(logItem);
          newLogsByTraceId.set(logItem.trace_id, logSet);
        }
      }

      // Set state once with all accumulated changes
      set({ logsById: newLogsById, logsByTraceId: newLogsByTraceId });
    }

    const { eventsById } = get();
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
      const { tracesById, profilesByTraceId } = get();
      const existingTrace = tracesById.get(traceCtx.trace_id);

      // Initialize or get existing trace
      let trace = existingTrace ?? initializeTrace(event);

      // Update timestamps for all events
      trace.start_timestamp = Math.min(event.start_timestamp ?? event.timestamp, trace.start_timestamp);
      trace.timestamp = Math.max(event.timestamp, trace.timestamp);

      if (isTraceEvent(event)) {
        // Process transaction event and update trace
        const result = processTransactionEvent(event, {
          existingTrace: trace,
          profilesByTraceId,
        });
        trace = result.trace;
      } else if (isErrorEvent(event)) {
        // For error events, increment error count
        trace.errors += 1;
      }

      // Update trace metadata and status for all events with trace context
      updateTraceMetadata(trace);

      if (traceCtx.status !== "ok") {
        trace.status = traceCtx.status;
      }

      // Always save trace to store (whether new or updated)
      const newTracesById = new Map(tracesById);
      newTracesById.set(trace.trace_id, trace);
      set({ tracesById: newTracesById });
    }

    if (isProfileEvent(event)) {
      const { profilesByTraceId, tracesById } = get();
      const { profiles } = processProfileEvent(event, { tracesById });

      // Update store with processed profiles
      const newProfilesByTraceId = new Map(profilesByTraceId);
      for (const { traceId, profile } of profiles) {
        newProfilesByTraceId.set(traceId, profile);
      }
      set({ profilesByTraceId: newProfilesByTraceId });
    }
  },
  getEvents: () => Array.from(get().eventsById.values()),
});
