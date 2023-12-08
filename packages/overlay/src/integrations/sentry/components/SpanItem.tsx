import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactComponent as ChevronIcon } from '~/assets/chevronDown.svg';
import classNames from '../../../lib/classNames';
import { Span, TraceContext } from '../types';
import { getDuration, getSpanDurationClassName } from '../utils/duration';
import PlatformIcon from './PlatformIcon';
import SpanTree from './SpanTree';

const SpanItem = ({
  span,
  startTimestamp,
  totalDuration,
  depth = 1,
  traceContext,
}: {
  span: Span;
  startTimestamp: number;
  totalDuration: number;
  depth?: number;
  traceContext: TraceContext;
}) => {
  const { spanId } = useParams();
  const [renderChildren, setRenderChildren] = useState(depth <= 5);

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
        <div className={classNames('node', span.status && span.status !== 'ok' ? 'text-red-400' : '')}>
          {(span.children || []).length > 0 && (
            <div
              className="bg-primary-600 mr-1 flex items-center gap-1 rounded-lg px-1 text-xs font-bold text-white"
              onClick={e => {
                e.preventDefault();
                setRenderChildren(prev => !prev);
              }}
            >
              {(span.children || []).length}
              <ChevronIcon
                width={12}
                height={12}
                className={classNames('transition', renderChildren ? 'rotate-180' : 'rotate-0')}
              />
            </div>
          )}
          {span.transaction && <PlatformIcon size={16} platform={span.transaction.platform} />}
          {span.op && (
            <>
              <span className="font-bold">{span.op}</span>
              <span className="text-primary-400">&ndash;</span>
            </>
          )}
          <span className="block max-w-sm truncate" title={span.description || span.span_id}>
            {span.description || span.span_id}
          </span>
        </div>
        <div className="waterfall">
          <div
            className="bg-primary-900 absolute -m-0.5 w-full p-0.5"
            style={{
              left: `min(${((span.start_timestamp - startTimestamp) / totalDuration) * 100}%, 95% - 1px)`,
              width: `max(1px, ${(spanDuration / totalDuration) * 95}%)`,
            }}
          >
            <span className={classNames('whitespace-nowrap', getSpanDurationClassName(spanDuration))}>
              {spanDuration.toLocaleString()} ms
            </span>
          </div>
        </div>
      </Link>

      {renderChildren && (
        <SpanTree
          traceContext={traceContext}
          tree={span.children || []}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          depth={depth + 1}
        />
      )}
    </li>
  );
};

export default SpanItem;
