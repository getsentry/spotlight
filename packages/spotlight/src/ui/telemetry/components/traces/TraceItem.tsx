import { cn } from "@spotlight/ui/lib/cn";
import { OriginBadge } from "@spotlight/ui/telemetry/components/shared/OriginBadge";
import TimeSince from "@spotlight/ui/telemetry/components/shared/TimeSince";
import { Badge } from "@spotlight/ui/ui/badge";
import { Link, useParams } from "react-router-dom";
import type { Span, Trace } from "../../types";
import { getFormattedSpanDuration } from "../../utils/duration";
import { truncateId } from "../../utils/text";
import { hasAISpans } from "../insights/aiTraces/sdks/aiLibraries";
import { TraceRootTxnName } from "./TraceDetails/components/TraceRootTxnName";
import TraceIcon from "./TraceIcon";

type TraceItemProps = {
  trace: Trace;
  className?: string;
};

export function AIBadge({ trace }: { trace: Trace }) {
  if (!hasAISpans(trace)) {
    return null;
  }
  // If the trace has AI spans, we display a badge indicating that.
  return (
    <>
      <div>&mdash;</div>
      <Badge title="This trace contains AI interactions" className="bg-blue-500/20 text-white border-blue-500/30">
        ✨ AI
      </Badge>
    </>
  );
}

export function TraceStatusBadge({ trace }: { trace: Trace }) {
  const { status } = trace;
  if (!status) {
    return null;
  }

  return (
    <>
      <div className={cn(status === "ok" ? "text-green-400" : status ? "text-red-400" : "")}>{status}</div>
      <div>&mdash;</div>
    </>
  );
}

export function TraceHeaderDetails({ trace }: { trace: Trace }) {
  const duration = getFormattedSpanDuration(trace);

  return (
    <>
      <div>{duration}</div>
      <div>&mdash;</div>
      <div>
        {trace.spans.size.toLocaleString()} spans, {trace.transactions.length.toLocaleString()} txns
      </div>
    </>
  );
}

export function SpanHeader({ span }: { span: Span }) {
  return (
    <>
      <div>&mdash; </div>
      <div>span: {span.op || truncateId(span.span_id)}</div>
    </>
  );
}

export default function TraceItem({ trace, className }: TraceItemProps) {
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();
  const isSelected = traceId === trace.trace_id;
  const truncatedId = truncateId(trace.trace_id);
  const span = spanId && trace.spans.get(spanId);

  // TODO: if (spanId && !span) -> error

  // TODO: For this #<traceId> link to work as intended, we need to do something like this:
  //       https://dev.to/mindactuate/scroll-to-anchor-element-with-react-router-v6-38op
  return (
    <Link
      className={cn(
        "hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2",
        isSelected && "bg-primary-800",
        className,
      )}
      to={isSelected && !spanId ? `/telemetry/traces#${trace.trace_id}` : `/telemetry/traces/${trace.trace_id}/context`}
    >
      <TraceIcon trace={trace} />
      <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
        <div className="flex items-center gap-x-2">
          <div>{truncatedId}</div>
          <OriginBadge sourceType={trace.rootTransaction?.__sourceType} />
        </div>
        <TimeSince date={trace.start_timestamp} />
      </div>
      <TraceRootTxnName trace={trace} />
      <div className="flex flex-col truncate font-mono">
        <div className="text-primary-300 flex gap-2 text-sm">
          <TraceStatusBadge trace={trace} />
          <TraceHeaderDetails trace={trace} />
          {isSelected ? span && <SpanHeader span={span} /> : <AIBadge trace={trace} />}
        </div>
      </div>
    </Link>
  );
}
