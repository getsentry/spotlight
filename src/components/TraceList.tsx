import { getDuration } from "~/lib/duration";
import classNames from "~/lib/classNames";
import { Trace } from "~/types";
import TimeSince from "./TimeSince";
import PlatformIcon from "./PlatformIcon";
import { useSentryTraces } from "~/lib/useSentryTraces";

export default function TraceList({
  setActiveTrace,
}: {
  setActiveTrace: (trace: Trace) => void;
}) {
  const traceList = useSentryTraces();

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
