import type { Envelope } from "@sentry/core";
import logfmt from "logfmt";
import type { SentryMetricEvent, SentryMetricPayload } from "../../parser/index.ts";
import { formatTimestamp } from "../utils.ts";

function formatSingleMetric(metric: SentryMetricPayload): string {
  const data: Record<string, any> = {
    timestamp: formatTimestamp(metric.timestamp),
    type: "trace_metric",
    name: metric.name,
    metric_type: metric.type,
    value: metric.value,
  };

  if (metric.unit) {
    data.unit = metric.unit;
  }

  if (metric.trace_id) {
    data.trace_id = metric.trace_id;
  }

  if (metric.span_id) {
    data.span_id = metric.span_id;
  }

  if (metric.attributes) {
    for (const [key, attr] of Object.entries(metric.attributes)) {
      data[`attr.${key}`] = attr.value;
    }
  }

  return logfmt.stringify(data);
}

export function formatMetric(event: SentryMetricEvent, _envelopeHeader: Envelope[0]): string[] {
  return event.items.map(formatSingleMetric);
}
