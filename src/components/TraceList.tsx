import { getDuration } from "~/lib/duration";
import classNames from "~/lib/classNames";
import { SentryEvent, Trace } from "~/types";
import TimeSince from "./TimeSince";

export default function TraceList({
  events,
  setActiveTrace,
}: {
  events: SentryEvent[];
  setActiveTrace: (trace: Trace) => void;
}) {
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
      spans: [],
      transactions: 0,
      errors: 0,
      timestamp: endTs,
      start_timestamp: startTs,
      status: traceCtx.status,
      rootTransactionName: e.transaction,
    };
    if (e.type === "transaction") {
      trace.spans.push({
        ...traceCtx,
        start_timestamp: e.start_timestamp,
        timestamp: e.timestamp,
        description: traceCtx.description || e.transaction,
      });
      e.spans.forEach((s) => trace.spans.push(s));
      trace.transactions += 1;
      if (!trace.rootTransactionName) trace.rootTransactionName = e.transaction;
    } else {
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
                      {trace.transactions.toLocaleString()} txns
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
