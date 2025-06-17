import { useParams } from "react-router-dom";
import { Badge } from "~/ui/badge";
import TimeSince from "../../../../components/TimeSince";
import { isLocalTrace } from "../../store/helpers";
import type { Trace } from "../../types";
import { truncateId } from "../../utils/text";

// Custom hook for trace information
export function useTraceInfo(trace: Trace) {
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();
  const isSelected = traceId === trace.trace_id;
  const truncatedId = truncateId(trace.trace_id);
  const isLocal = isLocalTrace(trace.trace_id);
  const span = spanId && trace.spans.get(spanId);

  return {
    isSelected,
    truncatedId,
    isLocal,
    span,
    spanId,
  };
}

// Shared component for trace identifier section
export function TraceIdentifier({ trace }: { trace: Trace }) {
  const { truncatedId, isLocal } = useTraceInfo(trace);

  return (
    <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
      <div className="flex items-center gap-x-2">
        <div>{truncatedId}</div>
        {isLocal && <Badge title="This trace is part of your local session.">Local</Badge>}
      </div>
      <TimeSince date={trace.start_timestamp} />
    </div>
  );
}
