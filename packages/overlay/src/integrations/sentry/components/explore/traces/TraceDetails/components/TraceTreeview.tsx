import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchProvider, useSearch } from '~/integrations/sentry/context/SearchContext';
import useSearchInput from '~/integrations/sentry/hooks/useSearchInput';
import { Trace } from '~/integrations/sentry/types';
import { ReactComponent as CrossIcon } from '../../../../../../../assets/cross.svg';
import sentryDataCache from '../../../../../data/sentryDataCache';
import { getFormattedSpanDuration } from '../../../../../utils/duration';
import DateTime from '../../../../DateTime';
import SpanDetails from '../../spans/SpanDetails';
import SpanTree from '../../spans/SpanTree';

type TraceTreeViewProps = { traceId: string };

export const DEFAULT_SPAN_NODE_WIDTH = 50;

function TraceTreeWithSearch({
  trace,
  startTimestamp,
  totalDuration,
}: {
  trace: Trace;
  startTimestamp: number;
  totalDuration: number;
}) {
  const { setQuery, showOnlyMatched, setShowOnlyMatched } = useSearch();
  const { inputValue, showReset, handleChange, handleReset } = useSearchInput(setQuery, 500);

  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(DEFAULT_SPAN_NODE_WIDTH);

  if (trace.spans.size === 0) {
    return null;
  }
  return (
    <>
      <div className="mx-6 mb-4 mt-2 flex gap-2">
        <div className="bg-primary-950 text-primary-50 border-primary-600 hover:border-primary-500 relative mt-2 flex h-auto w-full flex-1 gap-2 rounded-md border py-1 pl-4 pr-6 outline-none transition-all">
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
        <button
          className={` mt-2 rounded border px-2 py-1 text-sm ${
            showOnlyMatched
              ? 'bg-primary-600 border-white text-white'
              : 'bg-primary-800 text-primary-300  border-primary-500 hover:bg-primary-700'
          }`}
          onClick={() => setShowOnlyMatched(!showOnlyMatched)}
        >
          Only Show Matches
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-6">
        <SpanTree
          traceContext={trace}
          tree={trace.spanTree}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          totalTransactions={(trace.transactions || []).length}
          spanNodeWidth={spanNodeWidth}
          setSpanNodeWidth={setSpanNodeWidth}
        />
      </div>
    </>
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
      <TraceTreeWithSearch trace={trace} startTimestamp={startTimestamp} totalDuration={totalDuration} />
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
