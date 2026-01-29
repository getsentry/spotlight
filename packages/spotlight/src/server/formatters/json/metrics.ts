import type { Envelope } from "@sentry/core";
import type { SentryMetricEvent } from "../../parser/index.ts";

export function formatMetric(event: SentryMetricEvent, _envelopeHeader: Envelope[0]): string[] {
  return [JSON.stringify(event)];
}
