import { useState } from "react";

import classNames from "../../lib/classNames";
import { SentryTransactionEvent, Span } from "../../types";
import { sum } from "~/lib/math";
import { groupSpans } from "~/lib/traces";
import SpanDetails from "./Transaction/SpanDetails";
import SpanTree from "./Transaction/SpanTree";

export function TransactionTitle({ event }: { event: SentryTransactionEvent }) {
  return (
    <>
      {event.contexts.trace.trace_id} &mdash; {event.transaction}
    </>
  );
}

export function TransactionSummary({
  event,
}: {
  event: SentryTransactionEvent;
}) {
  const ctx = event.contexts.trace;
  return (
    <div className="font-mono space-y-1">
      <h3 className="font-medium">{event.transaction || "Unknown"}</h3>
      <div className="text-sm text-indigo-300 flex gap-x-1">
        <div
          className={classNames(
            ctx.status === "ok" ? "text-green-400" : "text-red-400"
          )}
        >
          {ctx.status}
        </div>
        <span className="text-indigo-400">&mdash;</span>
        <span>
          {sum(
            event.spans,
            (i) =>
              new Date(i.timestamp).getTime() -
              new Date(i.start_timestamp).getTime()
          )}
          {" ms"}
        </span>
        <span className="text-indigo-400">&mdash;</span>
        <span>{ctx.trace_id}</span>
        <span>({event.spans.length} spans)</span>
      </div>
    </div>
  );
}

export default function Transaction({
  event,
}: {
  event: SentryTransactionEvent;
}) {
  const groupedSpans = groupSpans(event.spans);
  const startTimestamp = new Date(event.start_timestamp).getTime();
  const totalDuration = new Date(event.timestamp).getTime() - startTimestamp;

  const [activeSpan, setActiveSpan] = useState<Span | null>(null);

  return (
    <>
      <div className="font-mono space-y-4 mb-4">
        <h3 className="flex flex-col">
          <strong className="text-xl">{event.contexts.trace.trace_id}</strong>
          <span className="">{event.transaction}</span>
        </h3>
      </div>

      <SpanTree
        traceContext={event.contexts.trace}
        tree={groupedSpans}
        startTimestamp={startTimestamp}
        totalDuration={totalDuration}
        setActiveSpan={setActiveSpan}
        activeSpan={activeSpan}
        root
      />

      {activeSpan ? (
        <SpanDetails
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          span={activeSpan}
          onClose={() => setActiveSpan(null)}
        />
      ) : null}
    </>
  );
}
