import { log } from "@spotlight/ui/lib/logger";
import type { SentryStore, SharedSliceActions } from "@spotlight/ui/telemetry/store/types";
import type { SentryErrorEvent } from "@spotlight/ui/telemetry/types";
import { getNativeFetchImplementation } from "@spotlight/ui/telemetry/utils/fetch";
import type { StateCreator } from "zustand";

export const createSharedSlice: StateCreator<SentryStore, [], [], SharedSliceActions> = (set, get) => ({
  getEventById: (id: string) => get().eventsById.get(id),
  getTraceById: (id: string) => get().tracesById.get(id),
  getEventsByTrace: (traceId: string, spanId?: string | null) => {
    const { getEvents } = get();
    return getEvents().filter(evt => {
      const trace = evt.contexts?.trace;
      if (!trace || trace.trace_id !== traceId) return false;
      if (spanId !== undefined) return trace.span_id === spanId;
      return true;
    });
  },
  processStacktrace: async (errorEvent: SentryErrorEvent): Promise<void> => {
    if (!errorEvent.exception || !errorEvent.exception.values) {
      return;
    }

    await Promise.all(
      (errorEvent.exception.values ?? []).map(async exception => {
        if (!exception.stacktrace || !exception.stacktrace.frames) {
          return;
        }
        exception.stacktrace.frames.reverse();

        if (exception.stacktrace.frames.every(frame => frame.post_context && frame.pre_context && frame.context_line)) {
          log("Skipping contextlines request as we have full context for", exception);
          return;
        }

        try {
          const makeFetch = getNativeFetchImplementation();
          const stackTraceWithContextResponse = await makeFetch(get().contextLinesProvider, {
            method: "PUT",
            body: JSON.stringify(exception.stacktrace),
          });

          if (!stackTraceWithContextResponse.ok || stackTraceWithContextResponse.status !== 200) {
            return;
          }

          const stackTraceWithContext = await stackTraceWithContextResponse.json();
          exception.stacktrace = stackTraceWithContext;
        } catch {
          // Something went wrong, for now we just ignore it.
        }

        return;
      }),
    );
  },
  resetData: () => {
    set({
      envelopes: new Map(),
      eventsById: new Map(),
      tracesById: new Map(),
      sdks: new Map(),
      profilesByTraceId: new Map(),
      profileChunksByProfilerId: new Map(),
      logsById: new Map(),
      logsByTraceId: new Map(),
      metricsById: new Map(),
      metricsByTraceId: new Map(),
      metricsByName: new Map(),
    });
  },
});
