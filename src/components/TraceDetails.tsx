import { SpanWithChildren, groupSpans } from "~/lib/traces";
import { Trace } from "../types";
import useKeyPress from "~/lib/useKeyPress";
import SpanDetails from "./SpanDetails";
import SpanTree from "./SpanTree";
import { useState } from "react";

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

  const groupedSpans = groupSpans(trace.spans);
  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  const [activeSpan, setActiveSpan] = useState<SpanWithChildren | null>(null);

  return (
    <>
      <div className="px-6 py-4 flex gap-x-2 bg-indigo-950">
        <div className="flex flex-1 gap-x-2">
          <button
            className="hover:underline text-indigo-400"
            onClick={(e) => {
              e.stopPropagation();
              clearActiveTrace();
            }}
          >
            Traces
          </button>
          <div className="text-indigo-600">/</div>
          <h1 className="max-w-full truncate">{trace.rootTransactionName}</h1>
        </div>
        <div className="font-mono">{trace.trace_id}</div>
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
    </>
  );
}
