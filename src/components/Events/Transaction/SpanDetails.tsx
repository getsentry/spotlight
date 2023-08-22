import DateTime from "~/components/DateTime";
import useKeyPress from "~/lib/useKeyPress";
import { Span } from "~/types";

import { format as formatSQL } from "sql-formatter";

function formatSpanDescription(desc: string) {
  if (desc.match(/^(SELECT|INSERT|UPDATE|DELETE|TRUNCATE|ALTER) /i)) {
    try {
      console.log(desc.replace(/([\s,(])(%[a-z])([\s,)])/gim, "$1?$3"));
      return formatSQL(desc.replace(/([\s,(])(%[a-z])([\s,)])/gim, "$1?$3"));
    } catch (err) {
      console.error(err);
    }
  }
  return desc;
}

export default function SpanDetails({
  span,
  startTimestamp,
  totalDuration,
  onClose,
}: {
  span: Span;
  startTimestamp: number;
  totalDuration: number;
  onClose: () => void;
}) {
  useKeyPress("Escape", () => {
    onClose();
  });

  const spanStartTimestamp = new Date(span.start_timestamp).getTime();
  const spanDuration = new Date(span.timestamp).getTime() - spanStartTimestamp;

  return (
    <div className="fixed h-full right-0 top-0 bottom-0 left-1/4 bg-indigo-900 border-l border-l-indigo-400 z-[2147483647] py-4 px-6 overflow-auto">
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
          onClick={() => onClose()}
        >
          {"✕"}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-1 items-center text-indigo-300">
            <DateTime date={span.start_timestamp} />
            <span className="text-indigo-400 flex-1 text-center">⟶</span>
            <DateTime date={span.timestamp} />
          </div>
          <div className="flex-1">
            <div className="relative border border-indigo-600 py-1 mb-4 h-8">
              <div
                className="bg-indigo-600 absolute w-full p-0.5 -m-0.5 top-0 bottom-0 flex items-center justify-center"
                style={{
                  left: `min(${
                    ((new Date(span.start_timestamp).getTime() -
                      startTimestamp) /
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

        <h2 className="font-bold uppercase">Description</h2>
        {span.description ? (
          <pre className="whitespace-pre-wrap font-mono text-indigo-300">
            {formatSpanDescription(span.description)}
          </pre>
        ) : (
          <div className="text-indigo-300">
            No description recorded for this span.
          </div>
        )}

        <h2 className="font-bold uppercase">Tags</h2>
        {span.tags && Object.keys(span.tags).length ? (
          <table className="w-full">
            {Object.entries(span.tags).map(([key, value]) => {
              return (
                <tr key={key}>
                  <th className="w-1/12 text-left text-indigo-300 font-normal font-mono pr-4">
                    <div className="truncate w-full">{key}</div>
                  </th>
                  <td>
                    <pre className="whitespace-nowrap font-mono">
                      {JSON.stringify(value, undefined, 2)}
                    </pre>
                  </td>
                </tr>
              );
            })}
          </table>
        ) : (
          <div className="text-indigo-300">No tags recorded for this span.</div>
        )}

        <h2 className="font-bold uppercase">Context</h2>
        <table className="w-full">
          {[
            ["trace", span.trace_id],
            ["span", span.span_id],
            ["parent", span.parent_span_id],
            ["op", span.op],
          ].map(([key, value]) => {
            return (
              <tr key={key}>
                <th className="w-1/12 text-left text-indigo-300 font-normal font-mono pr-4">
                  <div className="truncate w-full">{key}</div>
                </th>
                <td>
                  <pre className="whitespace-nowrap font-mono">{value}</pre>
                </td>
              </tr>
            );
          })}
        </table>
      </div>
    </div>
  );
}
