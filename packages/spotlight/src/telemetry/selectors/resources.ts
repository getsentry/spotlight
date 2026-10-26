import type { Span } from "../types.ts";
import { type SpanSummary, summarizeSpans } from "./spans.ts";

export type ResourceSummary = SpanSummary & { averageEncodedSizeBytes: number };

export function getResourceSummaries(spans: readonly Span[]): ResourceSummary[] {
  return summarizeSpans(spans.filter(span => /resource\.[A-Za-z]+/.test(span.op ?? ""))).map(group => ({
    ...group,
    averageEncodedSizeBytes:
      group.spans.reduce((sum, span) => {
        const size = span.data?.["http.response_content_length"];
        return sum + (typeof size === "number" ? size : 0);
      }, 0) / group.count,
  }));
}
