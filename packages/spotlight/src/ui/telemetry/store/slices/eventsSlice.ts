import { generateUuidv4 } from "@spotlight/ui/lib/uuid";
import type { StateCreator } from "zustand";
import { graftProfileSpans } from "../../data/profiles";
import type { SentryEvent, SentryLogEventItem, SentryMetricPayload } from "../../types";
import type { SentryTransactionEvent } from "../../types";
import {
  isErrorEvent,
  isLogEvent,
  isMetricEvent,
  isProfileChunkEvent,
  isProfileEvent,
  isTraceEvent,
} from "../../utils/sentry";
import type { EventsSliceActions, EventsSliceState, SentryProfileWithTraceMeta, SentryStore } from "../types";
import { toTimestamp } from "../utils";
import { processLogItems } from "../utils/logProcessor";
import { processMetricItems } from "../utils/metricProcessor";
import { mergeChunksToProfile, processProfileChunkEvent } from "../utils/profileChunkProcessor";
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

    if (isMetricEvent(event) && event.items?.length) {
      const { metricsById, metricsByTraceId, metricsByName } = get();
      const { processedMetrics } = processMetricItems(event);

      const newMetricsById = new Map(metricsById);
      const newMetricsByTraceId = new Map(metricsByTraceId);
      const newMetricsByName = new Map(metricsByName);

      for (const metric of processedMetrics) {
        newMetricsById.set(metric.id, metric);

        if (metric.trace_id) {
          const metricSet = newMetricsByTraceId.get(metric.trace_id) || new Set<SentryMetricPayload>();
          metricSet.add(metric);
          newMetricsByTraceId.set(metric.trace_id, metricSet);
        }

        const metricsWithName = newMetricsByName.get(metric.name) || [];
        metricsWithName.push(metric);
        newMetricsByName.set(metric.name, metricsWithName);
      }

      set({ metricsById: newMetricsById, metricsByTraceId: newMetricsByTraceId, metricsByName: newMetricsByName });
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
      const { tracesById, profilesByTraceId, profileChunksByProfilerId } = get();
      const existingTrace = tracesById.get(traceCtx.trace_id);

      // Initialize or get existing trace
      let trace = existingTrace ?? initializeTrace(event);

      // Update timestamps for all events
      trace.start_timestamp = Math.min(event.start_timestamp ?? event.timestamp, trace.start_timestamp);
      trace.timestamp = Math.max(event.timestamp, trace.timestamp);

      let mergedV2Profile: SentryProfileWithTraceMeta | undefined;

      if (isTraceEvent(event)) {
        // Process transaction event and update trace
        const result = processTransactionEvent(event, {
          existingTrace: trace,
          profilesByTraceId,
          profileChunksByProfilerId,
        });
        trace = result.trace;
        mergedV2Profile = result.mergedProfile;
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

      // If we merged a V2 profile, store it by trace_id so the UI can find it
      if (mergedV2Profile) {
        const newProfilesByTraceId = new Map(profilesByTraceId);
        newProfilesByTraceId.set(trace.trace_id, mergedV2Profile);
        set({ tracesById: newTracesById, profilesByTraceId: newProfilesByTraceId });
      } else {
        set({ tracesById: newTracesById });
      }
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

    // Handle V2 profile chunks (continuous profiling)
    if (isProfileChunkEvent(event)) {
      const { profileChunksByProfilerId, tracesById, eventsById, profilesByTraceId } = get();
      const { chunk } = processProfileChunkEvent(event);

      // Update store with processed profile chunk
      const newProfileChunksByProfilerId = new Map(profileChunksByProfilerId);
      const existingChunks = newProfileChunksByProfilerId.get(chunk.profiler_id) || [];

      // Check if this chunk already exists (by chunk_id)
      if (!existingChunks.some(c => c.chunk_id === chunk.chunk_id)) {
        const updatedChunks = [...existingChunks, chunk];
        newProfileChunksByProfilerId.set(chunk.profiler_id, updatedChunks);

        // Check if there's an existing transaction with this profiler_id that needs re-grafting
        // This handles the case where profile chunks arrive AFTER the transaction
        let traceToUpdate: string | undefined;
        let activeThreadId: string | undefined;
        for (const evt of eventsById.values()) {
          if (isTraceEvent(evt)) {
            const txn = evt as SentryTransactionEvent;
            const profileCtx = txn.contexts?.profile as { profiler_id?: string } | undefined;
            if (profileCtx?.profiler_id === chunk.profiler_id) {
              traceToUpdate = txn.contexts.trace.trace_id;
              activeThreadId = txn.contexts.trace.data?.["thread.id"] as string | undefined;
              break;
            }
          }
        }

        if (traceToUpdate) {
          // Re-graft with updated chunks
          const existingTrace = tracesById.get(traceToUpdate);
          if (existingTrace && !existingTrace.profileGrafted) {
            const mergedProfile = mergeChunksToProfile(updatedChunks, activeThreadId);
            if (mergedProfile) {
              // Create a shallow copy of the trace to trigger React re-render
              const trace = {
                ...existingTrace,
                spans: new Map(existingTrace.spans),
                spanTree: [...existingTrace.spanTree],
              };
              graftProfileSpans(trace, mergedProfile);

              // Store updated trace and profile
              const newTracesById = new Map(tracesById);
              newTracesById.set(traceToUpdate, trace);
              const newProfilesByTraceId = new Map(profilesByTraceId);
              newProfilesByTraceId.set(traceToUpdate, mergedProfile);
              set({
                profileChunksByProfilerId: newProfileChunksByProfilerId,
                tracesById: newTracesById,
                profilesByTraceId: newProfilesByTraceId,
              });
              return;
            }
          }
        }

        set({ profileChunksByProfilerId: newProfileChunksByProfilerId });
      }
    }
  },
  getEvents: () => Array.from(get().eventsById.values()),
});
