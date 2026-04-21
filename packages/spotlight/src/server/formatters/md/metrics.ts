import type { Envelope } from "@sentry/core";
import type { SentryMetricEvent, SentryMetricPayload } from "../../parser/index.ts";
import { formatTimestamp } from "../utils.ts";

function formatMetricRow(metric: SentryMetricPayload): string {
  const timestamp = formatTimestamp(metric.timestamp);
  const attributes =
    metric.attributes && Object.keys(metric.attributes).length > 0
      ? Object.entries(metric.attributes)
          .map(([key, attr]) => `${key}=${attr.value}`)
          .join(", ")
      : "";

  const traceInfo = metric.trace_id ? metric.trace_id.substring(0, 8) : "";

  return `| ${timestamp} | ${metric.name} | ${metric.type} | ${metric.value} | ${metric.unit ?? ""} | ${traceInfo} | ${attributes} |`;
}

export function formatMetric(event: SentryMetricEvent, _envelopeHeader: Envelope[0]): string[] {
  const lines: string[] = [];

  lines.push("## Metrics");
  lines.push("");
  lines.push("| Timestamp | Name | Type | Value | Unit | Trace | Attributes |");
  lines.push("|-----------|------|------|-------|------|-------|------------|");

  for (const metric of event.items) {
    lines.push(formatMetricRow(metric));
  }

  return lines;
}
