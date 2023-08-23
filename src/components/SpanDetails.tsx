import DateTime from "~/components/DateTime";
import useKeyPress from "~/lib/useKeyPress";

import { format as formatSQL } from "sql-formatter";
import { getDuration } from "~/lib/duration";
import SpanTree from "./SpanTree";
import { SentryErrorEvent, Span, TraceContext } from "~/types";
import { ErrorTitle } from "./Events/Error";
import dataCache from "~/lib/dataCache";
import { useNavigation } from "~/lib/useNavigation";

function formatSpanDescription(desc: string) {
  if (desc.match(/^(SELECT|INSERT|UPDATE|DELETE|TRUNCATE|ALTER) /i)) {
    try {
      return formatSQL(desc.replace(/([\s,(])(%[a-z])([\s,)])/gim, "$1?$3"));
    } catch (err) {
      console.error(err);
    }
  }
  return desc;
}

export default function SpanDetails({
  traceContext,
  span,
  startTimestamp,
  totalDuration,
}: {
  traceContext: TraceContext;
  span: Span;
  startTimestamp: number;
  totalDuration: number;
}) {
  const { setEventId, setSpanId } = useNavigation();

  useKeyPress("Escape", () => {
    setSpanId(span.trace_id, null);
  });

  const spanDuration = getDuration(span.start_timestamp, span.timestamp);

  const errors = dataCache
    .getEventsByTrace(span.trace_id)
    .filter((e) => e.type !== "transaction");

  return (
    <div className="fixed h-full right-0 top-0 bottom-0 left-1/4 bg-indigo-900 border-l border-l-indigo-400 py-4 px-6 overflow-auto">
      <div className="flex border-b border-b-indigo-400 pb-4 mb-4">
        <div className="flex-1">
          <h2 className="text-xl text-indigo-300">Span Details</h2>
          <h3 className="font-mono">
            {span.op} <span className="text-indigo-500">&mdash;</span>{" "}
            {span.span_id}
          </h3>
        </div>
        <button
          className="cursor-pointer px-3 py-1 -my-1 text-2xl -mr-3 rounded bg-indigo-900 hover:bg-black font-mono"
          onClick={() => setSpanId(span.trace_id, null)}
        >
          {"✕"}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-1 items-center text-indigo-300 gap-x-1">
              <DateTime date={span.start_timestamp} />
              <span>&mdash;</span>
              <span>
                {getDuration(startTimestamp, span.start_timestamp)} into trace
              </span>
            </div>
            <div className="flex-1">
              <div className="relative border border-indigo-600 py-1 h-8">
                <div
                  className="bg-indigo-600 absolute w-full p-0.5 -m-0.5 top-0 bottom-0 flex items-center justify-center"
                  style={{
                    left: `min(${
                      ((span.start_timestamp - startTimestamp) /
                        totalDuration) *
                      100
                    }%, 100% - 1px)`,
                    width: `max(1px, ${(spanDuration / totalDuration) * 100}%)`,
                  }}
                >
                  <span className="whitespace-nowrap">{spanDuration} ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!!errors.length && (
          <div className="flex flex-col items-start">
            <h2 className="font-bold uppercase mb-2">Related Errors</h2>
            {errors.map((event) => (
              <button
                key={event.event_id}
                className="cursor-pointer underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setEventId(event.event_id);
                }}
              >
                <ErrorTitle event={event as SentryErrorEvent} />
              </button>
            ))}
          </div>
        )}

        <div>
          <h2 className="font-bold uppercase mb-2">Description</h2>
          {span.description ? (
            <pre className="whitespace-pre-wrap font-mono text-indigo-300">
              {formatSpanDescription(span.description)}
            </pre>
          ) : (
            <div className="text-indigo-300">
              No description recorded for this span.
            </div>
          )}
        </div>

        <div>
          <h2 className="font-bold uppercase mb-2">Tags</h2>
          {span.tags && Object.keys(span.tags).length ? (
            <table className="w-full">
              <tbody>
                {Object.entries(span.tags).map(([key, value]) => {
                  return (
                    <tr key={key}>
                      <th className="w-1/12 text-left text-indigo-300 font-normal font-mono pr-4 py-0.5">
                        <div className="truncate w-full">{key}</div>
                      </th>
                      <td className="py-0.5">
                        <pre className="whitespace-nowrap font-mono">
                          {JSON.stringify(value, undefined, 2)}
                        </pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-indigo-300">
              No tags recorded for this span.
            </div>
          )}
        </div>
        <div>
          <h2 className="font-bold uppercase mb-2">Context</h2>
          <table className="w-full">
            <tbody>
              {[
                ["status", span.status || ""],
                ["trace", span.trace_id],
                ["span", span.span_id],
                ["parent", span.parent_span_id],
                ["op", span.op],
              ].map(([key, value]) => {
                return (
                  <tr key={key}>
                    <th className="w-1/12 text-left text-indigo-300 font-normal font-mono pr-4 py-0.5">
                      <div className="truncate w-full">{key}</div>
                    </th>
                    <td className="py-0.5">
                      <pre className="whitespace-nowrap font-mono">{value}</pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="font-bold uppercase mb-2">Sub-tree</h2>
          <div className="bg-indigo-950 border-indigo-900 border -mx-3">
            <SpanTree
              traceContext={traceContext}
              tree={span.children || []}
              startTimestamp={startTimestamp}
              totalDuration={totalDuration}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
