import { Link, useParams } from 'react-router-dom';
import classNames from '../../../lib/classNames';
import { Span, TraceContext } from '../types';
import { getDuration, getSpanDurationClassName } from '../utils/duration';
import PlatformIcon from './PlatformIcon';

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
  const { spanId } = useParams();

  if (!tree || !tree.length) return null;

  return (
    <ul className="tree">
      {tree.map(span => {
        const spanDuration = getDuration(span.start_timestamp, span.timestamp);
        return (
          <li key={span.span_id} className="pl-4">
            <Link
              className={classNames(
                'hover:bg-primary-900 flex cursor-pointer text-sm',
                spanId === span.span_id ? 'bg-primary-900' : '',
              )}
              to={`/traces/${span.trace_id}/${span.span_id}`}
            >
              <div
                className={classNames(
                  'node',
                  span.transaction
                    ? span.status === 'ok'
                      ? 'text-green-400'
                      : 'text-red-400'
                    : span.status && span.status !== 'ok'
                    ? 'text-red-400'
                    : '',
                )}
              >
                {span.transaction && <PlatformIcon size={16} platform={span.transaction.platform} />}
                <span className="font-bold">{span.op}</span>
                <span className="text-primary-400">&ndash;</span>
                <span className="block max-w-sm truncate">{span.description || span.span_id}</span>
              </div>
              <div className="waterfall">
                <div
                  className="bg-primary-900 absolute -m-0.5 w-full p-0.5"
                  style={{
                    left: `min(${((span.start_timestamp - startTimestamp) / totalDuration) * 100}%, 100% - 1px)`,
                    width: `max(1px, ${(spanDuration / totalDuration) * 100}%)`,
                  }}
                >
                  <span className={classNames('whitespace-nowrap', getSpanDurationClassName(spanDuration))}>
                    {spanDuration.toLocaleString()} ms
                  </span>
                </div>
              </div>
            </Link>
            <SpanTree
              traceContext={traceContext}
              tree={span.children || []}
              startTimestamp={startTimestamp}
              totalDuration={totalDuration}
              depth={depth + 1}
            />
          </li>
        );
      })}
    </ul>
  );
}
