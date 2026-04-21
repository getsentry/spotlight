import type { MetricType } from "@sentry/core";
import type { SentryMetricPayload } from "../types";

/**
 * Aggregate metrics by type (sum for counters, avg for distributions, etc.)
 */
export function aggregateMetrics(
  metrics: SentryMetricPayload[],
  type: MetricType,
): {
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  count: number;
} {
  if (metrics.length === 0) {
    return { count: 0 };
  }

  const values = metrics.map(m => m.value);

  switch (type) {
    case "counter":
      return {
        sum: values.reduce((a, b) => a + b, 0),
        count: metrics.length,
      };
    case "gauge":
    case "distribution":
      return {
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: metrics.length,
      };
    default:
      return { count: metrics.length };
  }
}

/**
 * Calculate percentiles for a distribution of values
 */
export function calculatePercentiles(values: number[], percentiles: number[]): Map<number, number> {
  if (values.length === 0) {
    return new Map();
  }

  const sorted = [...values].sort((a, b) => a - b);
  const result = new Map<number, number>();

  for (const percentile of percentiles) {
    if (percentile < 0 || percentile > 100) continue;

    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      result.set(percentile, sorted[lower] ?? 0);
    } else {
      const value = (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
      result.set(percentile, value);
    }
  }

  return result;
}

/**
 * Get metrics grouped by name
 */
export function groupMetricsByName(metrics: SentryMetricPayload[]): Map<string, SentryMetricPayload[]> {
  const groups = new Map<string, SentryMetricPayload[]>();

  for (const metric of metrics) {
    const existing = groups.get(metric.name) || [];
    existing.push(metric);
    groups.set(metric.name, existing);
  }

  return groups;
}
