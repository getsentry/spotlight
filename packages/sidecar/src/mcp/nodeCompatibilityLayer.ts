import type { StateCreator } from 'zustand';
import { contextLinesHandler } from '../contextlines.js'; // Existing sidecar function
import type { 
  SentryStore, 
  SharedSliceActions, 
  SettingsSliceActions, 
  SettingsSliceState,
  SentryErrorEvent 
} from './nodeAdapter.js';

// ✅ THESE 7 SLICES WORK DIRECTLY IN NODE.JS (no changes needed):
// - eventsSlice.ts       - Pure JS event processing and storage
// - tracesSlice.ts       - Pure JS trace management
// - logsSlice.ts         - Pure JS log storage and retrieval  
// - profilesSlice.ts     - Pure JS profile data management
// - envelopesSlice.ts    - Pure JS envelope storage
// - sdksSlice.ts         - Pure JS SDK metadata tracking
// - subscriptionsSlice.ts - Pure JS event subscription system

// 🔧 ONLY 2 SLICES NEED NODE.JS ADAPTATION (specific compatibility issues):

// 1. SETTINGS SLICE COMPATIBILITY ISSUE:
// Problem: Original settingsSlice.ts constructs URLs assuming it's running in browser
// Original code:
//   contextLinesProvider: new URL(CONTEXT_LINES_ENDPOINT, DEFAULT_SIDECAR_URL).href
//   setSidecarUrl: (url) => set({ contextLinesProvider: new URL(..., url).href })
// 
// Solution: In Node.js sidecar, we don't need to make HTTP requests to ourselves
export const createNodeSettingsSlice: StateCreator<
  SentryStore,
  [],
  [],
  SettingsSliceState & SettingsSliceActions
> = (set) => ({
  // Use internal reference instead of HTTP URL
  contextLinesProvider: 'internal://sidecar/context-lines',
  setSidecarUrl: (url: string) => {
    // No-op in Node.js - we ARE the sidecar, no need to set our own URL
    console.log(`Node.js sidecar: setSidecarUrl called with ${url}, ignoring`);
  },
});

// 2. SHARED SLICE COMPATIBILITY ISSUE:
// Problem: Original sharedSlice.ts uses window.fetch to get stacktrace context lines
// Original code (lines 37-38 in sharedSlice.ts):
//   const makeFetch = getNativeFetchImplementation(); // Returns window.fetch
//   const response = await makeFetch(get().contextLinesProvider, { method: "PUT", ... })
//
// The issue: getNativeFetchImplementation() specifically accesses window.fetch:
//   export function getNativeFetchImplementation(): FetchImpl {
//     if (fetchIsWrapped(window.fetch)) {
//       return window.fetch.__sentry_original__;
//     }
//     return window.fetch;
//   }
//
// Solution: Replace HTTP fetch with direct call to sidecar's internal context handler
export const createNodeSharedSlice: StateCreator<
  SentryStore,
  [],
  [],
  SharedSliceActions
> = (set, get) => ({
  // ✅ These functions work directly (no browser dependencies)
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
  
  // 🔧 ONLY THIS FUNCTION needs adaptation (replaces window.fetch with internal call)
  processStacktrace: async (errorEvent: SentryErrorEvent): Promise<void> => {
    if (!errorEvent.exception?.values) return;

    await Promise.all(
      errorEvent.exception.values.map(async (exception) => {
        if (!exception.stacktrace?.frames) return;
        
        exception.stacktrace.frames.reverse();
        
        if (exception.stacktrace.frames.every(frame => 
          frame.post_context && frame.pre_context && frame.context_line)) {
          return; // Already have full context
        }

        try {
          // 🔧 REPLACEMENT: Use sidecar's internal handler instead of window.fetch
          // Original would do: await makeFetch(contextLinesProvider, { method: "PUT", body: JSON.stringify(stacktrace) })
          // Node.js does: await contextLinesHandler(stacktrace) - direct function call, no HTTP
          const stackTraceWithContext = await contextLinesHandler(exception.stacktrace);
          exception.stacktrace = stackTraceWithContext;
        } catch (error) {
          console.warn('Failed to process stacktrace in Node.js:', error);
        }
      })
    );
  },
  
  resetData: () => {
    set({
      envelopes: new Map(),
      eventsById: new Map(),
      tracesById: new Map(),
      sdks: new Map(),
      profilesByTraceId: new Map(),
      localTraceIds: new Set(),
      logsById: new Map(),
      logsByTraceId: new Map(),
    });
  },
});