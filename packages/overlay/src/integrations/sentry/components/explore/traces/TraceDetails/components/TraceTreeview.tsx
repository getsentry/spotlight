import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReactComponent as ChevronIcon } from '~/assets/chevronDown.svg';
import { SearchProvider, useSearch } from '~/integrations/sentry/context/SearchContext';
import useSearchInput from '~/integrations/sentry/hooks/useSearchInput';
import classNames from '~/lib/classNames';
import { ReactComponent as CrossIcon } from '../../../../../../../assets/cross.svg';
import sentryDataCache from '../../../../../data/sentryDataCache';
import { getFormattedSpanDuration } from '../../../../../utils/duration';

import EventContexts from '~/integrations/sentry/components/events/EventContexts';
import { Trace } from '~/integrations/sentry/types';
import DateTime from '../../../../DateTime';
import SpanDetails from '../../spans/SpanDetails';
import SpanTree from '../../spans/SpanTree';
import TraceTreeviewResizer from './TraceTreeviewResizer';

type TraceTreeViewProps = { traceId: string };

export const DEFAULT_SPAN_NODE_WIDTH = 50;
export const DEFAULT_DIV_HEIGHT = 500;

function RenderTraceTree({
  trace,
  startTimestamp,
  totalDuration,
}: {
  trace: Trace;
  startTimestamp: number;
  totalDuration: number;
}) {
  const { setQuery } = useSearch();
  const { inputValue, showReset, handleChange, handleReset } = useSearchInput(setQuery, 500);

  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(DEFAULT_SPAN_NODE_WIDTH);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [divHeight, setDivHeight] = useState<number>(DEFAULT_DIV_HEIGHT);

  const [isTreeCollapsed, setIsTreeCollapsed] = useState<boolean>(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsRendering(false);
    });
  }, []);

  function handleResize(e: MouseEvent) {
    const movementY = e.movementY;
    setDivHeight(prevHeight => {
      const newHeight = Math.max(200, prevHeight + movementY);
      if (newHeight === prevHeight) {
        return prevHeight;
      }
      return newHeight;
    });
  }

  if (trace.spans.size === 0) {
    return null;
  }

  return (
    <div className="border-primary-800 mx-6 my-4 flex w-auto flex-col rounded-md border">
      <button
        onClick={() => setIsTreeCollapsed(prev => !prev)}
        className={classNames(
          'bg-primary-900 hover:bg-primary-800 flex w-full cursor-pointer items-center justify-between p-4',
        )}
      >
        <span>Trace Tree</span>

        <ChevronIcon
          width={12}
          height={12}
          className={classNames('transition', isTreeCollapsed ? 'rotate-0' : 'rotate-180')}
        />
      </button>

      {isTreeCollapsed ? null : (
        <>
          <div className="bg-primary-950 text-primary-50 border-primary-600 hover:border-primary-500 relative mx-6 mb-4 mt-2 flex h-auto w-auto gap-2 rounded-md border py-1 pl-4 pr-6 outline-none transition-all">
            <input
              className="text-primary-50 h-auto w-full flex-1 bg-transparent outline-none transition-all"
              onChange={handleChange}
              value={inputValue}
              placeholder="Search in Trace"
            />
            {showReset ? (
              <CrossIcon
                onClick={handleReset}
                className="fill-primary-50 absolute right-1 top-[5px] cursor-pointer"
                height={20}
                width={20}
              />
            ) : null}
          </div>

          <div
            className=" overflow-y-auto overflow-x-hidden px-2 pb-6"
            style={{
              minHeight: `${divHeight}px`,
              height: `${divHeight}px`,
            }}
          >
            {isRendering ? (
              <SpanTree.Loader />
            ) : (
              <SpanTree
                traceContext={trace}
                tree={trace.spanTree}
                startTimestamp={startTimestamp}
                totalDuration={totalDuration}
                totalTransactions={(trace.transactions || []).length}
                spanNodeWidth={spanNodeWidth}
                setSpanNodeWidth={setSpanNodeWidth}
              />
            )}
          </div>
          <TraceTreeviewResizer setIsResizing={setIsResizing} isResizing={isResizing} handleResize={handleResize} />
        </>
      )}
    </div>
  );
}

function RenderTraceContext({ trace }: { trace: Trace }) {
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  return (
    <div className="border-primary-800 mx-6 my-4 flex w-auto flex-col rounded-md border">
      <button
        onClick={() => setIsContextCollapsed(prev => !prev)}
        className={classNames(
          'bg-primary-900 hover:bg-primary-800 flex w-full cursor-pointer items-center justify-between p-4',
          isContextCollapsed ? 'rounded-md' : 'rounded-none',
        )}
      >
        <span>Trace Context</span>

        <ChevronIcon
          width={12}
          height={12}
          className={classNames('transition', isContextCollapsed ? 'rotate-0' : 'rotate-180')}
        />
      </button>

      {isContextCollapsed ? null : <EventContexts event={trace.rootTransaction || trace.transactions[0]} />}
    </div>
  );
}

function TraceTreeviewContent({ traceId }: TraceTreeViewProps) {
  const { spanId } = useParams();

  const trace = sentryDataCache.getTraceById(traceId)!;
  const span = spanId ? trace.spans.get(spanId) : undefined;
  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  return (
    <>
      <div className="px-6 py-4">
        <div className="text-primary-300 flex flex-1 items-center gap-x-1">
          <div className="text-primary-200">
            <DateTime date={trace.start_timestamp} />
          </div>
          <span>&mdash;</span>
          <span>
            <strong className="text-primary-200 font-bold">{getFormattedSpanDuration(trace)}</strong> recorded in{' '}
            <strong className="text-primary-200 font-bold">{trace.spans.size.toLocaleString()} spans</strong>
          </span>
        </div>
      </div>

      <RenderTraceTree trace={trace} startTimestamp={startTimestamp} totalDuration={totalDuration} />
      <RenderTraceContext trace={trace} />
      {span ? (
        <SpanDetails
          traceContext={trace}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          span={span}
          totalTransactions={(trace.transactions || []).length}
        />
      ) : null}
    </>
  );
}

export default function TraceTreeview(props: TraceTreeViewProps) {
  return (
    <SearchProvider>
      <TraceTreeviewContent {...props} />
    </SearchProvider>
  );
}
