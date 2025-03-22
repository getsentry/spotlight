import { Fragment } from 'react';
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
          />
        );
      })}
    </ul>
  );
}

SpanTree.Loader = () => (
  <div className="animate-pulse pt-2">
    <ul className="tree space-y-2">
      <li>
        <ul className="deep">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index}>
              <div className="mb-2 h-3 w-1/2 rounded bg-zinc-400"></div>
              <ul className="deep">
                {Array.from({ length: 2 }).map((_, subIndex) => (
                  <Fragment key={subIndex}>
                    <li>
                      <div className="mb-2 ml-4 h-3 w-1/3 rounded bg-zinc-400"></div>
                    </li>
                    <li>
                      <div className="mb-2 ml-8 h-3 w-1/4 rounded bg-zinc-400"></div>
                    </li>
                    <li>
                      <div className="mb-2 ml-8 h-3 w-1/4 rounded bg-zinc-400"></div>
                    </li>
                  </Fragment>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </li>
    </ul>
  </div>
);
