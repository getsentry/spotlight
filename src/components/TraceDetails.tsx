import { SpanWithChildren, groupSpans } from "~/lib/traces";
import { Trace } from "../types";
import useKeyPress from "~/lib/useKeyPress";
import SpanDetails from "./SpanDetails";
import SpanTree from "./SpanTree";
import { useRef, useState } from "react";
import { getDuration } from "~/lib/duration";
import DateTime from "./DateTime";

export default function TraceDetails({
  trace,
  clearActiveTrace,
}: {
  trace: Trace;
  clearActiveTrace: () => void;
}) {
  useKeyPress("Escape", () => {
    clearActiveTrace();
  });

  const [activeSpan, setActiveSpan] = useState<SpanWithChildren | null>(null);

  const ref = useRef(null);

  const groupedSpans = groupSpans(trace.spans);
  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  return (
    <div ref={ref}>
      <div className="px-6 py-4 flex gap-x-2 bg-indigo-950  items-center">
        <h1 className="text-2xl max-w-full truncate flex-1">
          {trace.rootTransactionName}
        </h1>
        <div className="font-mono text-indigo-300">
          <div>T: {trace.trace_id}</div>
          <div>S: {trace.span_id}</div>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="flex flex-1 items-center text-indigo-300 gap-x-1">
          <div className="text-indigo-200">
            <DateTime date={trace.start_timestamp} />
          </div>
          <span>&mdash;</span>
          <span>
            <strong className="font-bold text-indigo-200">
              {getDuration(trace.start_timestamp, trace.timestamp)}
            </strong>{" "}
            recorded in{" "}
            <strong className="font-bold text-indigo-200">
              {trace.spans.length} spans
            </strong>
          </span>
        </div>
      </div>
      <div className="divide-indigo-500 flex-1 bg-indigo-950 px-6 py-4">
        <SpanTree
          traceContext={trace}
          tree={groupedSpans}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          setActiveSpan={setActiveSpan}
          activeSpan={activeSpan}
        />

        {activeSpan ? (
          <SpanDetails
            traceContext={trace}
            startTimestamp={startTimestamp}
            totalDuration={totalDuration}
            span={activeSpan}
            onClose={() => setActiveSpan(null)}
            setActiveSpan={setActiveSpan}
            activeSpan={activeSpan}
          />
        ) : null}
      </div>
    </div>
  );
}
