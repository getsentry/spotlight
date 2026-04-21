import type { SentryMetricPayload } from "../../parser/types.ts";
import { getBuffer } from "../../utils/index.ts";
import type { EventContainer } from "../../utils/index.ts";

/**
 * Extract all metrics from envelopes
 */
function extractMetricsFromEnvelopes(envelopes: EventContainer[]): SentryMetricPayload[] {
  const allMetrics: SentryMetricPayload[] = [];

  for (const envelope of envelopes) {
    const parsed = envelope.getParsedEnvelope();
    if (!parsed) continue;

    const [, items] = parsed.envelope;
    for (const [itemHeader, itemData] of items) {
      if (itemHeader.type === "trace_metric" && itemData && typeof itemData === "object") {
        const payload = itemData as { items?: SentryMetricPayload[] };
        if (payload.items && Array.isArray(payload.items)) {
          allMetrics.push(...payload.items);
        }
      }
    }
  }

  return allMetrics;
}

/**
 * Query metrics with filters
 */
export function queryMetrics(filters: {
  name?: string;
  type?: string;
  traceId?: string;
  timeWindow?: number;
  limit?: number;
}): SentryMetricPayload[] {
  const envelopes = getBuffer().read(
    filters.timeWindow
      ? {
          timeWindow: filters.timeWindow,
        }
      : { all: true },
  );

  const allMetrics = extractMetricsFromEnvelopes(envelopes);

  // Apply filters
  let filtered = allMetrics;

  if (filters.name) {
    const nameFilter = filters.name;
    filtered = filtered.filter(m => m.name === nameFilter || m.name.includes(nameFilter));
  }

  if (filters.type) {
    filtered = filtered.filter(m => m.type === filters.type);
  }

  if (filters.traceId) {
    const traceIdFilter = filters.traceId;
    filtered = filtered.filter(m => m.trace_id === traceIdFilter || (m.trace_id?.startsWith(traceIdFilter) ?? false));
  }

  // Sort by timestamp (newest first) and apply limit
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}
