import classNames from "~/lib/classNames";
import { SpanWithChildren } from "~/lib/traces";
import { TraceContext } from "~/types";

export default function SpanTree({
  traceContext,
  tree,
  startTimestamp,
  totalDuration,
  depth = 1,
  activeSpan,
  setActiveSpan,
}: {
  traceContext: TraceContext;
  tree: SpanWithChildren[];
  startTimestamp: number;
  totalDuration: number;
  depth?: number;
  activeSpan: SpanWithChildren | null;
  setActiveSpan: (span: SpanWithChildren) => void;
}) {
  if (!tree.length) return null;

  return (
    <>
      {tree.map((span) => {
        const spanStartTimestamp = new Date(span.start_timestamp).getTime();
        const spanDuration =
          new Date(span.timestamp).getTime() - spanStartTimestamp;
        return (
          <ul key={span.span_id}>
            <li>
              <div
                className={classNames(
                  "text-sm flex relative hover:bg-indigo-800 cursor-pointer",
                  activeSpan?.span_id === span.span_id ? "bg-indigo-800" : ""
                )}
                onClick={() => setActiveSpan(span)}
              >
                <div
                  className="flex gap-x-1 py-1 w-6/12"
                  style={{
                    paddingLeft: depth * 12,
                  }}
                >
                  <span className="font-bold">{span.op}</span>
                  <span className="text-indigo-400">&ndash;</span>
                  <span className="max-w-sm block truncate">
                    {span.description || span.span_id}
                  </span>
                </div>
                <div className="flex-1 relative border-l border-l-indigo-800 py-1">
                  <div
                    className="bg-indigo-900 absolute w-full p-0.5 -m-0.5"
                    style={{
                      left: `min(${
                        ((new Date(span.start_timestamp).getTime() -
                          startTimestamp) /
                          totalDuration) *
                        100
                      }%, 100% - 1px)`,
                      width: `max(1px, ${
                        (spanDuration / totalDuration) * 100
                      }%)`,
                    }}
                  >
                    <span className="whitespace-nowrap">{spanDuration} ms</span>
                  </div>
                </div>
              </div>
              <SpanTree
                traceContext={traceContext}
                tree={span.children}
                startTimestamp={startTimestamp}
                totalDuration={totalDuration}
                depth={depth + 1}
                activeSpan={activeSpan}
                setActiveSpan={setActiveSpan}
              />
            </li>
          </ul>
        );
      })}
    </>
  );
}
