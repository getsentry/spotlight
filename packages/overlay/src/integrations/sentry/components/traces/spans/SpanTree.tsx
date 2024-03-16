import { Span, TraceContext } from '../../../types';
import SpanItem from './SpanItem';

export default function SpanTree({
  traceContext,
  tree,
  startTimestamp,
  totalDuration,
  depth = 1,
  collapsible = false,
}: {
  traceContext: TraceContext;
  tree: Span[];
  startTimestamp: number;
  totalDuration: number;
  depth?: number;
  collapsible?: boolean;
}) {
  if (!tree || !tree.length) return null;

  return (
    <ul className="tree">
      {tree.map(span => {
        return (
          <SpanItem
            key={span.span_id}
            traceContext={traceContext}
            depth={depth}
            span={span}
            startTimestamp={startTimestamp}
            totalDuration={totalDuration}
            collapsible={collapsible}
          />
        );
      })}
    </ul>
  );
}
