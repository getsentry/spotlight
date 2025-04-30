import { StateCreator } from 'zustand';
import { log } from '~/lib/logger';
import { SentryErrorEvent } from '../../types';
import { getNativeFetchImplementation } from '../../utils/fetch';
import { SentryStore, SharedSliceActions } from '../types';

export const createSharedSlice: StateCreator<SentryStore, [], [], SharedSliceActions> = (set, get) => ({
  getEventById: (id: string) => get().events.find(e => e.event_id === id),
  getTraceById: (id: string) => get().tracesById.get(id),
  getEventsByTrace: (traceId: string, spanId?: string | null) => {
    const { events } = get();
    return events.filter(evt => {
      const trace = evt.contexts?.trace;
      if (!trace || trace.trace_id !== traceId) return false;
      if (spanId !== undefined) return trace.span_id === spanId;
      return true;
    });
  },
  processStacktrace: async (errorEvent: SentryErrorEvent): Promise<void[]> => {
    if (!errorEvent.exception || !errorEvent.exception.values) {
      return [];
    }

    return Promise.all(
      (errorEvent.exception.values ?? []).map(async exception => {
        if (!exception.stacktrace) {
          return;
        }
        exception.stacktrace.frames.reverse();

        if (
          exception.stacktrace.frames?.every(frame => frame.post_context && frame.pre_context && frame.context_line)
        ) {
          log('Skipping contextlines request as we have full context for', exception);
          return;
        }

        try {
          const makeFetch = getNativeFetchImplementation();
          const stackTraceWithContextResponse = await makeFetch(get().contextLinesProvider, {
            method: 'PUT',
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
      }),
    );
  },
  resetData: () => {
    set({
      envelopes: [],
      events: [],
      eventIds: new Set(),
      traces: [],
      tracesById: new Map(),
      profilesByTraceId: new Map(),
      localTraceIds: new Set(),
    });
  },
});
