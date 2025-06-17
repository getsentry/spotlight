import { useMemo } from "react";
import { hasAISpans } from "../components/insights/aiTraces/sdks/aiLibraries";
import { isLocalTrace } from "../store/helpers";
import type { Trace } from "../types";
import { getFormattedSpanDuration } from "../utils/duration";
import { truncateId } from "../utils/text";

export function useTraceDisplay(trace: Trace) {
  const truncatedId = useMemo(() => truncateId(trace.trace_id), [trace.trace_id]);
  const isLocal = useMemo(() => isLocalTrace(trace.trace_id), [trace.trace_id]);
  const duration = useMemo(() => getFormattedSpanDuration(trace), [trace]);
  const hasAI = useMemo(() => hasAISpans(trace), [trace]);

  const stats = useMemo(
    () => ({
      spanCount: trace.spans.size.toLocaleString(),
      transactionCount: trace.transactions.length.toLocaleString(),
    }),
    [trace.spans.size, trace.transactions.length],
  );

  return {
    truncatedId,
    isLocal,
    duration,
    hasAI,
    stats,
    status: trace.status,
    startTimestamp: trace.start_timestamp,
  };
}
