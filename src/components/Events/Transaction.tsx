import classNames from "../../lib/classNames";
import { SentryTransactionEvent, Span, TraceContext } from "../../types";

function sum<T>(arr: T[], cb: (item: T) => number): number {
  return arr.reduce((acc, current) => acc + cb(current), 0);
}

export function getTransactionEventTitle({
  event,
}: {
  event: SentryTransactionEvent;
}) {
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

type SpanWithChildren = Span & {
  children: SpanWithChildren[];
};

function groupSpans(spans: Span[]) {
  // ordered
  const results: SpanWithChildren[] = [];
  // hash with pointers
  const idLookup: { [spanId: string]: SpanWithChildren } = {};

  spans.forEach((span) => {
    const parent = idLookup[span.parent_span_id];
    const newItem = {
      ...span,
      children: [],
    };
    if (parent) {
      parent.children.push(newItem);
    } else {
      results.push(newItem);
    }
    idLookup[span.span_id] = newItem;
  });

  return results;
}

function SpanTree({
  traceContext,
  tree,
  startTimestamp,
  totalDuration,
  root = false,
  depth = 1,
}: {
  traceContext: TraceContext;
  tree: SpanWithChildren[];
  startTimestamp: number;
  totalDuration: number;
  root?: boolean;
  depth?: number;
}) {
  if (!tree.length) return null;

  const lastSpanIdx = tree.length - 1;
  return (
    <>
      {tree.map((span, spanIdx) => {
        const spanStartTimestamp = new Date(span.start_timestamp).getTime();
        const spanDuration =
          new Date(span.timestamp).getTime() - spanStartTimestamp;
        return (
          <ul className={root ? "tree" : ""}>
            <li
              key={span.span_id}
              className={spanIdx === lastSpanIdx ? "last" : ""}
            >
              <div className="text-sm flex relative">
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
              />
            </li>
          </ul>
        );
      })}
    </>
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
        root
      />
    </>
  );
}
