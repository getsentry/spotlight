import { generateUuidv4 } from "@spotlight/ui/lib/uuid";
import type { SentryMetricEvent, SentryMetricPayload } from "../../types";

export interface MetricProcessingResult {
  processedMetrics: SentryMetricPayload[];
}

/**
 * Processes metric items from a metric event, adding id fields for UI tracking.
 * @param event The metric event to process
 * @returns Processed metric items ready to be stored
 */
export function processMetricItems(event: SentryMetricEvent): MetricProcessingResult {
  const processedMetrics: SentryMetricPayload[] = [];

  if (!event.items?.length) {
    return { processedMetrics };
  }

  for (const metric of event.items) {
    // Generate a unique ID for each metric if not present
    const metricId = metric.id || generateUuidv4();

    processedMetrics.push({
      ...metric,
      id: metricId,
    });
  }

  return { processedMetrics };
}
