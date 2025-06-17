import { Link, useParams } from "react-router-dom";
import { Badge } from "~/ui/badge";
import TimeSince from "../../../../components/TimeSince";
import classNames from "../../../../lib/classNames";
import { isLocalTrace } from "../../store/helpers";
import type { Span, Trace } from "../../types";
import { getFormattedSpanDuration } from "../../utils/duration";
import { truncateId } from "../../utils/text";
import { hasAISpans } from "../insights/aiTraces/sdks/aiLibraries";
import { TraceRootTxnName } from "./TraceDetails/components/TraceRootTxnName";
import TraceIcon from "./TraceIcon";

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
      <div className={classNames(status === "ok" ? "text-green-400" : status ? "text-red-400" : "")}>{status}</div>
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

// Custom hook for shared trace display logic
function useTraceDisplay(trace: Trace) {
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();
  const isSelected = traceId === trace.trace_id;
  const truncatedId = truncateId(trace.trace_id);
  const isLocal = isLocalTrace(trace.trace_id);
  const span = spanId ? trace.spans.get(spanId) : undefined;

  return {
    isSelected,
    truncatedId,
    isLocal,
    span,
    spanId,
  };
}

// Shared content component
type TraceContentProps = {
  trace: Trace;
  isSelected: boolean;
  truncatedId: string;
  isLocal: boolean | null;
  span?: Span;
};

function TraceContent({ trace, isSelected, truncatedId, isLocal, span }: TraceContentProps) {
  return (
    <>
      <TraceIcon trace={trace} />
      <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
        <div className="flex items-center gap-x-2">
          <div>{truncatedId}</div>
          {isLocal && <Badge title="This trace is part of your local session.">Local</Badge>}
        </div>
        <TimeSince date={trace.start_timestamp} />
      </div>
      <TraceRootTxnName trace={trace} />
      <div className="flex flex-col truncate font-mono">
        <div className="text-primary-300 flex space-x-2 text-sm">
          <TraceStatusBadge trace={trace} />
          <TraceHeaderDetails trace={trace} />
          {isSelected ? span && <SpanHeader span={span} /> : <AIBadge trace={trace} />}
        </div>
      </div>
    </>
  );
}

// Component for clickable list items
type TraceListItemProps = {
  trace: Trace;
  className?: string;
};

export function TraceListItem({ trace, className }: TraceListItemProps) {
  const { isSelected, truncatedId, isLocal, span, spanId } = useTraceDisplay(trace);

  // TODO: For this #<traceId> link to work as intended, we need to do something like this:
  //       https://dev.to/mindactuate/scroll-to-anchor-element-with-react-router-v6-38op
  return (
    <Link
      className={classNames(
        "hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2",
        isSelected && "bg-primary-800",
        className,
      )}
      to={isSelected && !spanId ? `../#${trace.trace_id}` : `/traces/${trace.trace_id}/context`}
    >
      <TraceContent trace={trace} isSelected={isSelected} truncatedId={truncatedId} isLocal={isLocal} span={span} />
    </Link>
  );
}

// Component for non-interactive headers
type TraceHeaderProps = {
  trace: Trace;
  className?: string;
};

export function TraceHeader({ trace, className }: TraceHeaderProps) {
  const { isSelected, truncatedId, isLocal, span } = useTraceDisplay(trace);

  return (
    <div className={classNames("flex items-center gap-x-4 px-6 py-2", className)}>
      <TraceContent trace={trace} isSelected={isSelected} truncatedId={truncatedId} isLocal={isLocal} span={span} />
    </div>
  );
}

// Default export for backward compatibility (can be removed after updating imports)
export default function TraceItem(props: TraceListItemProps) {
  return <TraceListItem {...props} />;
}
