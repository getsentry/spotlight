import type { Envelope } from "@sentry/core";
import type { SentryMetricEvent, SentryMetricPayload } from "../../parser/index.ts";
import { formatTimestamp } from "../utils.ts";

function formatSingleMetric(metric: SentryMetricPayload): string {
  const parts: string[] = [];

  parts.push(`name=${metric.name}`);
  parts.push(`type=${metric.type}`);
  parts.push(`value=${metric.value}`);

  if (metric.unit) {
    parts.push(`unit=${metric.unit}`);
  }

  if (metric.trace_id) {
    parts.push(`trace_id=${metric.trace_id}`);
  }

  if (metric.span_id) {
    parts.push(`span_id=${metric.span_id}`);
  }

  if (metric.attributes) {
    for (const [key, attr] of Object.entries(metric.attributes)) {
      if (attr.value !== undefined && attr.value !== null) {
        parts.push(`${key}=${attr.value}`);
      }
    }
  }

  // Use metric timestamp as primary timestamp
  const ts = formatTimestamp(metric.timestamp);
  parts.push(`@${ts}`);

  return parts.join(" ");
}

export function formatMetric(event: SentryMetricEvent, _envelopeHeader: Envelope[0]): string[] {
  return event.items.map(formatSingleMetric);
}
