import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchProvider, useSearch } from '~/integrations/sentry/context/SearchContext';
import useSearchInput from '~/integrations/sentry/hooks/useSearchInput';
import useSentryStore from '~/integrations/sentry/store';
import type { Trace } from '~/integrations/sentry/types';
import { getFormattedSpanDuration } from '../../../../utils/duration';

import { ReactComponent as X } from '~/assets/cross.svg';
import { ReactComponent as Search } from '~/assets/search.svg';
import { Button } from '~/ui/button';
import { Input } from '~/ui/input';
import DateTime from '../../../shared/DateTime';
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
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search in Trace"
            value={inputValue}
            onChange={handleChange}
            className="border-primary-700 bg-primary-950 w-full pl-9 text-white placeholder:text-gray-400"
          />
          {showReset && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
              onClick={handleReset}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <button
          type="button"
          className={`rounded border px-2 py-1 text-sm ${
            showOnlyMatched ? 'border-primary-300 bg-primary-300' : 'border-primary-500 bg-primary-500'
          } text-white`}
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
  const getTraceById = useSentryStore(state => state.getTraceById);

  const trace = getTraceById(traceId)!;
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
