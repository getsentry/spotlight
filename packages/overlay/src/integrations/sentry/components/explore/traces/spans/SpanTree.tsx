import classNames from '../../../../../../lib/classNames';
import type { Span, TraceContext } from '../../../../types';
import SpanItem from './SpanItem';

export default function SpanTree({
  traceContext,
  tree,
  startTimestamp,
  totalDuration,
  depth = 1,
  totalTransactions,
  spanNodeWidth,
  setSpanNodeWidth,
  query,
}: {
  traceContext: TraceContext;
  tree: Span[];
  startTimestamp: number;
  totalDuration: number;
  depth?: number;
  totalTransactions?: number;
  spanNodeWidth: number;
  setSpanNodeWidth?: (val: number) => void;
  query?: string;
}) {
  if (!tree || !tree.length) return null;
  return (
    <ul className={classNames(tree.length > 1 && 'deep', 'tree')}>
      {tree.map(span => {
        return (
          <SpanItem
            key={span.span_id}
            traceContext={traceContext}
            depth={depth}
            span={span}
            totalTransactions={totalTransactions}
            startTimestamp={startTimestamp}
            totalDuration={totalDuration}
            spanNodeWidth={spanNodeWidth}
            setSpanNodeWidth={setSpanNodeWidth}
            query={query}
          />
        );
      })}
    </ul>
  );
}
