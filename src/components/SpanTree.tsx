import classNames from "~/lib/classNames";
import { Span, TraceContext } from "~/types";
import PlatformIcon from "./PlatformIcon";
import { getDuration, getSpanDurationClassName } from "~/lib/duration";
import { useNavigation } from "~/lib/useNavigation";

export default function SpanTree({
  traceContext,
  tree,
  startTimestamp,
  totalDuration,
  depth = 1,
}: {
  traceContext: TraceContext;
  tree: Span[];
  startTimestamp: number;
  totalDuration: number;
  depth?: number;
}) {
  const { spanId, setSpanId } = useNavigation();

  if (!tree.length) return null;

  return (
    <>
      {tree.map((span) => {
        const spanDuration = getDuration(span.start_timestamp, span.timestamp);
        return (
          <ul key={span.span_id}>
            <li>
              <div
                className={classNames(
                  "text-sm flex relative hover:bg-indigo-800 cursor-pointer",
                  spanId === span.span_id ? "bg-indigo-800" : ""
                )}
                onClick={() => setSpanId(span.trace_id, span.span_id)}
              >
                <div
                  className={classNames(
                    "flex items-center gap-x-1 py-1 w-6/12",
                    span.transaction
                      ? span.status === "ok"
                        ? "text-green-400"
                        : "text-red-400"
                      : span.status && span.status !== "ok"
                      ? "text-red-400"
                      : ""
                  )}
                  style={{
                    paddingLeft: depth * 12,
                  }}
                >
                  {span.transaction && (
                    <PlatformIcon
                      size={16}
                      platform={span.transaction.platform}
                    />
                  )}
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
                        ((span.start_timestamp - startTimestamp) /
                          totalDuration) *
                        100
                      }%, 100% - 1px)`,
                      width: `max(1px, ${
                        (spanDuration / totalDuration) * 100
                      }%)`,
                    }}
                  >
                    <span
                      className={classNames(
                        "whitespace-nowrap",
                        getSpanDurationClassName(spanDuration)
                      )}
                    >
                      {spanDuration} ms
                    </span>
                  </div>
                </div>
              </div>
              <SpanTree
                traceContext={traceContext}
                tree={span.children || []}
                startTimestamp={startTimestamp}
                totalDuration={totalDuration}
                depth={depth + 1}
              />
            </li>
          </ul>
        );
      })}
    </>
  );
}
