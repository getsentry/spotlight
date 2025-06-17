import { Link } from "react-router-dom";
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
import { TraceIdentifier, useTraceInfo } from "./TraceSharedComponents";

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

// Shared component for trace metadata section
export function TraceMetadata({ trace, showAIBadge = true }: { trace: Trace; showAIBadge?: boolean }) {
  const { span, isSelected } = useTraceInfo(trace);

  return (
    <div className="flex flex-col truncate font-mono">
      <div className="text-primary-300 flex space-x-2 text-sm">
        <TraceStatusBadge trace={trace} />
        <TraceHeaderDetails trace={trace} />
        {isSelected ? span && <SpanHeader span={span} /> : showAIBadge && <AIBadge trace={trace} />}
      </div>
    </div>
  );
}

// TraceListItem - for use in trace lists with navigation
export function TraceListItem({ trace, className }: { trace: Trace; className?: string }) {
  const { isSelected, spanId } = useTraceInfo(trace);

  return (
    <Link
      className={classNames(
        "hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2",
        isSelected && "bg-primary-800",
        className,
      )}
      to={isSelected && !spanId ? `../#${trace.trace_id}` : `/traces/${trace.trace_id}/context`}
    >
      <TraceIcon trace={trace} />
      <TraceIdentifier trace={trace} />
      <TraceRootTxnName trace={trace} />
      <TraceMetadata trace={trace} />
    </Link>
  );
}

// TraceHeader - for use as a non-clickable header in split views
export function TraceHeader({ trace, className }: { trace: Trace; className?: string }) {
  return (
    <div className={classNames("flex items-center gap-x-4 px-6 py-2", className)}>
      <TraceIcon trace={trace} />
      <TraceIdentifier trace={trace} />
      <TraceRootTxnName trace={trace} />
      <TraceMetadata trace={trace} />
    </div>
  );
}

// Keep the default export for backward compatibility
// It behaves like TraceListItem
export default function TraceItem({ trace, className }: TraceItemProps) {
  return <TraceListItem trace={trace} className={className} />;
}
