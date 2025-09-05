import type { StateCreator } from "zustand";
import type { SentryStore, TracesSliceActions, TracesSliceState } from "../types";

const initialTracesState: TracesSliceState = {
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
  getTraces: () => Array.from(get().tracesById.values()),
});
