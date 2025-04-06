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
  const { query, matchesQuery } = useSearch();

  const filteredTree = useMemo(() => {
    if (!query) return tree;
    const spanMemo = new Map<string, boolean>();
    const hasMatchingDescendant = (span: Span): boolean => {
      if (spanMemo.has(span.span_id)) return spanMemo.get(span.span_id)!;
      const result = matchesQuery(span) || (span.children?.some(child => hasMatchingDescendant(child)) ?? false);
      spanMemo.set(span.span_id, result);
      return result;
    };

    return tree.filter(span => hasMatchingDescendant(span));
  }, [query, tree]);

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
