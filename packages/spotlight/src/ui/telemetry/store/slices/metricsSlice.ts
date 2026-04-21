import type { StateCreator } from "zustand";
import type { MetricsSliceActions, MetricsSliceState, SentryStore } from "../types";

const initialMetricsState: MetricsSliceState = {
  metricsById: new Map(),
  metricsByTraceId: new Map(),
  metricsByName: new Map(),
};

export const createMetricsSlice: StateCreator<SentryStore, [], [], MetricsSliceState & MetricsSliceActions> = (
  _set,
  get,
) => ({
  ...initialMetricsState,
  getMetricById: (id: string) => get().metricsById.get(id),
  getMetrics: () => Array.from(get().metricsById.values()),
  getMetricsByTraceId: (traceId: string) => {
    const metricsByTraceId = get().metricsByTraceId.get(traceId);
    return metricsByTraceId ? Array.from(metricsByTraceId) : [];
  },
  getMetricsByName: (name: string) => {
    return get().metricsByName.get(name) || [];
  },
  getMetricNames: () => Array.from(get().metricsByName.keys()),
});
