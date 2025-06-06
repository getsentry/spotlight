import { Link } from "react-router-dom";
import { Badge } from "~/ui/badge";
import TimeSince from "../../../../components/TimeSince";
import classNames from "../../../../lib/classNames";
import { isLocalTrace } from "../../store/helpers";
import type { Trace } from "../../types";
import { getFormattedSpanDuration } from "../../utils/duration";
import { truncateId } from "../../utils/text";
import { hasAISpans } from "../insights/aiTraces/sdks/aiLibraries";
import { TraceRootTxnName } from "./TraceDetails/components/TraceRootTxnName";
import TraceIcon from "./TraceIcon";

type TraceItemProps = {
  trace: Trace;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  href?: string;
  asLink?: boolean;
};

export default function TraceItem({
  trace,
  isSelected = false,
  onClick,
  className,
  href,
  asLink = false,
}: TraceItemProps) {
  const duration = getFormattedSpanDuration(trace);
  const truncatedId = truncateId(trace.trace_id);
  const isLocal = isLocalTrace(trace.trace_id);
  const isAI = hasAISpans(trace);

  const content = (
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
          {trace.status && (
            <>
              <div
                className={classNames(trace.status === "ok" ? "text-green-400" : trace.status ? "text-red-400" : "")}
              >
                {trace.status}
              </div>
              <div>&mdash;</div>
            </>
          )}
          <div>{duration}</div>
          <div>&mdash;</div>
          <div>
            {trace.spans.size.toLocaleString()} spans, {trace.transactions.length.toLocaleString()} txns
          </div>
          {isAI && (
            <>
              <div>&mdash;</div>
              <Badge
                title="This trace contains AI interactions"
                className="bg-blue-500/20 text-white border-blue-500/30"
              >
                ✨ AI
              </Badge>
            </>
          )}
        </div>
      </div>
    </>
  );

  const wrapperClassName = classNames(
    "hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2",
    isSelected && "bg-primary-800",
    className,
  );

  if (asLink && href) {
    return (
      <Link className={wrapperClassName} to={href}>
        {content}
      </Link>
    );
  }

  return (
    <div className={wrapperClassName} onClick={onClick}>
      {content}
    </div>
  );
}
