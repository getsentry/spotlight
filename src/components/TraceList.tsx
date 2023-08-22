import { getDuration } from "~/lib/duration";
import classNames from "~/lib/classNames";
import { SentryEvent, SentryTransactionEvent, Span, Trace } from "~/types";
import TimeSince from "./TimeSince";
import PlatformIcon from "./PlatformIcon";

export default function TraceList({
  events,
  setActiveTrace,
}: {
  events: SentryEvent[];
  setActiveTrace: (trace: Trace) => void;
}) {
  // XXX: could move this into a TraceCache
  const traceMap = new Map<string, Trace>();
  [...events].reverse().forEach((e) => {
    if (!e.contexts?.trace) return;
    const traceCtx = e.contexts.trace;
    const traceId = traceCtx.trace_id;
    const startTs = e.start_timestamp
      ? new Date(e.start_timestamp).getTime()
      : 0;
    const endTs = e.timestamp ? new Date(e.timestamp).getTime() : 0;
    const trace = traceMap.get(traceId) || {
      ...traceCtx,
      spans: [] as Span[],
      transactions: [] as SentryTransactionEvent[],
      errors: 0,
      timestamp: endTs,
      start_timestamp: startTs,
      status: traceCtx.status,
      rootTransactionName: e.transaction || "(unknown transaction)",
      rootTransaction: null,
    };
    if (e.type === "transaction") {
      trace.spans.push({
        ...traceCtx,
        start_timestamp: e.start_timestamp,
        timestamp: e.timestamp,
        description: traceCtx.description || e.transaction,
        event: e,
      });
      e.spans.forEach((s) => trace.spans.push(s));
      trace.transactions.push(e);
    } else {
      // TODO: inject event reference in span tree?
      const refSpan = trace.spans.find(
        (s) =>
          traceCtx.trace_id === s.trace_id && traceCtx.span_id === s.span_id
      );
      if (refSpan) refSpan.event = e;
      trace.errors += 1;
    }
    trace.start_timestamp = Math.min(startTs, trace.start_timestamp);
    trace.timestamp = Math.max(endTs, trace.timestamp);
    if (traceCtx.status !== "ok") trace.status = traceCtx.status;
    traceMap.set(traceId, trace);
  });

  const traceList = Array.from(traceMap.values()).sort(
    (a, b) => b.start_timestamp - a.start_timestamp
  );

  traceList.forEach((t) => {
    const roots = t.transactions.filter(
      (e) => !e.contexts.trace.parent_span_id
    );
    if (roots.length === 1) {
      t.rootTransaction = roots[0];
      t.rootTransactionName = roots[0].transaction || "(unknown transaction)";
    } else if (roots.length > 1)
      t.rootTransactionName = "(multiple root transactions)";
    else t.rootTransactionName = "(missing root transaction)";
  });
  return (
    <>
      <div className="divide-y divide-indigo-500 bg-indigo-950">
        {traceList.length !== 0 ? (
          traceList.map((trace) => {
            return (
              <div
                className="px-6 py-4 flex gap-x-4 items-center cursor-pointer hover:bg-indigo-800"
                key={trace.trace_id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTrace(trace);
                }}
              >
                <PlatformIcon platform={trace.rootTransaction?.platform} />

                <div className="w-16 font-mono">
                  {getDuration(trace.start_timestamp, trace.timestamp)}
                </div>
                <div className="font-mono flex flex-1 flex-col truncate">
                  <div>{trace.rootTransactionName}</div>
                  <div className="text-indigo-300 flex space-x-2 text-sm">
                    <div
                      className={classNames(
                        trace.status === "ok"
                          ? "text-green-400"
                          : "text-red-400"
                      )}
                    >
                      {trace.status}
                    </div>
                    <div>
                      {" "}
                      {getDuration(trace.start_timestamp, trace.timestamp)}
                    </div>
                    <div>&mdash;</div>
                    <TimeSince date={trace.start_timestamp} />
                    <div>&mdash;</div>
                    <div>
                      {trace.spans.length.toLocaleString()} spans,{" "}
                      {trace.transactions.length.toLocaleString()} txns
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-indigo-300">
            Looks like there's no traces recorded matching this query. 🤔
          </div>
        )}
      </div>
    </>
  );
}
