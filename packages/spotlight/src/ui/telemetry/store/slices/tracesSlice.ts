import type { StateCreator } from "zustand";
import type { SentryStore, TracesSliceActions, TracesSliceState } from "../types";

const initialTracesState: TracesSliceState = {
  tracesById: new Map(),
};

export const createTracesSlice: StateCreator<SentryStore, [], [], TracesSliceState & TracesSliceActions> = (
  _,
  get,
) => ({
  ...initialTracesState,
  getTraces: () => Array.from(get().tracesById.values()),
});
