import { StateCreator } from 'zustand';
import type { SentryStore, TracesSliceActions, TracesSliceState } from '../types';

const initialTracesState: TracesSliceState = {
  traces: [],
  tracesById: new Map(),
  localTraceIds: new Set(),
};

export const createTracesSlice: StateCreator<SentryStore, [], [], TracesSliceState & TracesSliceActions> = (
  set,
  get,
) => ({
  ...initialTracesState,
  trackLocalTrace: (traceId: string) => {
    const { localTraceIds } = get();
    if (!localTraceIds.has(traceId)) {
      const newLocalTraceIds = new Set(localTraceIds);
      newLocalTraceIds.add(traceId);
      set({ localTraceIds: newLocalTraceIds });
    }
  },
  isTraceLocal: (traceId: string) => {
    const { localTraceIds } = get();
    if (localTraceIds.has(traceId)) return true;
    if (localTraceIds.size > 0) return false;
    return null;
  },
  getTraces: () => get().traces,
});
