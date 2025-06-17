import { Link, useParams } from "react-router-dom";
import { Badge } from "~/ui/badge";
import TimeSince from "../../../../components/TimeSince";
import classNames from "../../../../lib/classNames";
import { useTraceDisplay } from "../../hooks/useTraceDisplay";
import type { Span, Trace } from "../../types";
import { truncateId } from "../../utils/text";
import { TraceRootTxnName } from "./TraceDetails/components/TraceRootTxnName";
import TraceIcon from "./TraceIcon";

type TraceHeaderProps = {
  trace: Trace;
  span?: Span | null;
  className?: string;
};

function AIBadge({ trace }: { trace: Trace }) {
  const { hasAI } = useTraceDisplay(trace);

  if (!hasAI) {
    return null;
  }

  return (
    <>
      <div>&mdash;</div>
      <Badge title="This trace contains AI interactions" className="bg-blue-500/20 text-white border-blue-500/30">
        ✨ AI
      </Badge>
    </>
  );
}

function TraceStatusBadge({ status }: { status: string | undefined }) {
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

function TraceHeaderDetails({
  duration,
  stats,
}: { duration: string; stats: { spanCount: string; transactionCount: string } }) {
  return (
    <>
      <div>{duration}</div>
      <div>&mdash;</div>
      <div>
        {stats.spanCount} spans, {stats.transactionCount} txns
      </div>
    </>
  );
}

function SpanHeader({ span }: { span: Span }) {
  return (
    <>
      <div>&mdash; </div>
      <div>span: {span.op || truncateId(span.span_id)}</div>
    </>
  );
}

export default function TraceHeader({ trace, span, className }: TraceHeaderProps) {
  const { truncatedId, isLocal, duration, stats, status, startTimestamp } = useTraceDisplay(trace);
  const { spanId } = useParams<{ traceId: string; spanId: string }>();

  // Navigation logic:
  // - If we're viewing a span, clicking goes to the trace without the span
  // - If we're just viewing a trace, clicking goes back to the trace list
  const linkTo = spanId ? `/traces/${trace.trace_id}/context` : `../#${trace.trace_id}`;

  return (
    <Link
      to={linkTo}
      className={classNames("flex items-center gap-x-4 px-6 py-2 cursor-pointer hover:bg-primary-800", className)}
    >
      <TraceIcon trace={trace} />
      <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
        <div className="flex items-center gap-x-2">
          <div>{truncatedId}</div>
          {isLocal && <Badge title="This trace is part of your local session.">Local</Badge>}
        </div>
        <TimeSince date={startTimestamp} />
      </div>
      <TraceRootTxnName trace={trace} />
      <div className="flex flex-col truncate font-mono">
        <div className="text-primary-300 flex space-x-2 text-sm">
          <TraceStatusBadge status={status} />
          <TraceHeaderDetails duration={duration} stats={stats} />
          {span ? <SpanHeader span={span} /> : <AIBadge trace={trace} />}
        </div>
      </div>
    </Link>
  );
}
