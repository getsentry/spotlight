import { StateCreator } from 'zustand';
import type { LogsSliceActions, LogsSliceState, SentryStore } from '../types';

const initialLogsState: LogsSliceState = {
  logsById: new Map(),
  logsByTraceId: new Map(),
};

export const createLogsSlice: StateCreator<SentryStore, [], [], LogsSliceState & LogsSliceActions> = (_set, get) => ({
  ...initialLogsState,
  getLogById: (id: string) => get().logsById.get(id),
});
