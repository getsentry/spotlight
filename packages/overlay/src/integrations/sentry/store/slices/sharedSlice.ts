import type { StateCreator } from "zustand";
import type { SentryStore, SharedSliceActions } from "~/integrations/sentry/store/types";
import type { SentryErrorEvent } from "~/integrations/sentry/types";
import { getNativeFetchImplementation } from "~/integrations/sentry/utils/fetch";
import { log } from "~/lib/logger";

export const createSharedSlice: StateCreator<SentryStore, [], [], SharedSliceActions> = (set, get) => ({
  getEventById: (id: string) => get().eventsById.get(id),
  getTraceById: (id: string) => get().tracesById.get(id),
  getSpanById: (id: string) => {
    const { tracesById } = get();
    for (const trace of tracesById.values()) {
      const span = trace.spans.get(id);
      if (span) return span;
    }
    return undefined;
  },
  getEventsByTrace: (traceId: string, spanId?: string | null) => {
    const { events } = get();
    return events.filter(evt => {
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
        if (!exception.stacktrace) {
          return;
        }
        exception.stacktrace.frames.reverse();

        if (
          exception.stacktrace.frames?.every(frame => frame.post_context && frame.pre_context && frame.context_line)
        ) {
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
      envelopes: [],
      events: [],
      eventsById: new Map(),
      traces: [],
      tracesById: new Map(),
      profilesByTraceId: new Map(),
      localTraceIds: new Set(),
    });
  },
});
