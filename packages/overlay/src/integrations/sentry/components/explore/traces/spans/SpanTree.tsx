import { useMemo } from 'react';
import { useSearch } from '~/integrations/sentry/context/SearchContext';
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
}: {
  traceContext: TraceContext;
  tree: Span[];
  startTimestamp: number;
  totalDuration: number;
  depth?: number;
  totalTransactions?: number;
  spanNodeWidth: number;
  setSpanNodeWidth?: (val: number) => void;
}) {
  const { query } = useSearch();

  const matchesQuery = (span: Span): boolean | undefined => {
    return span.span_id.includes(query) || span.op?.includes(query) || span.description?.includes(query);
  };

  const hasMatchingDescendant = (span: Span): boolean => {
    if (matchesQuery(span)) return true;
    if (!span.children) return false;
    return span.children.some(hasMatchingDescendant);
  };

  const filteredTree = useMemo(() => (query ? tree.filter(span => hasMatchingDescendant(span)) : tree), [query, tree]);

  if (!tree || !tree.length) return null;

  return (
    <ul className={classNames(tree.length > 1 && 'deep', 'tree')}>
      {filteredTree.map(span => {
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
          />
        );
      })}
    </ul>
  );
}
