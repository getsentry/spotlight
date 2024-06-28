import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactComponent as CrossIcon } from '../../../../assets/cross.svg';
import dataCache from '../../data/sentryDataCache';
import useDebounce from '../../hooks/useDebounce';
import { getDuration } from '../../utils/duration';
import DateTime from '../DateTime';
import TraceIcon from './TraceIcon';
import SpanDetails from './spans/SpanDetails';
import SpanTree from './spans/SpanTree';

export default function TraceDetails() {
  const { traceId, spanId } = useParams();
  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(50);
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  const debounceQuery = useDebounce(q => {
    setDebouncedQuery(q);
  }, 200);

  if (!traceId) {
    return <p className="text-primary-300 p-6">Unknown trace id</p>;
  }

  const trace = dataCache.getTraceById(traceId);

  if (!trace) {
    return (
      <p className="text-primary-300 p-6">
        Trace not found. Check for more{' '}
        <Link to="/traces" className="underline">
          traces
        </Link>
      </p>
    );
  }
  const span = spanId ? dataCache.getSpanById(trace.trace_id, spanId) : undefined;

  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  function handleSearch(e: FormEvent<HTMLInputElement>) {
    setQuery(e.currentTarget.value);
    debounceQuery(e.currentTarget.value);
  }

  function handleResetSearch() {
    setQuery('');
  }

  return (
    <>
      <div className="border-b-primary-700 bg-primary-950 flex items-center gap-x-2 border-b px-6 py-4">
        <TraceIcon trace={trace} />
        <h1 className="max-w-full flex-1 truncate text-2xl">{trace.rootTransactionName}</h1>
        <div className="text-primary-300 font-mono">
          <div>T: {trace.trace_id}</div>
          <div>
            S:{' '}
            <Link to={`/traces/${trace.trace_id}/${trace.span_id}`} className="underline">
              {trace.span_id}
            </Link>
          </div>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="text-primary-300 flex flex-1 items-center gap-x-1">
          <div className="text-primary-200">
            <DateTime date={trace.start_timestamp} />
          </div>
          <span>&mdash;</span>
          <span>
            <strong className="text-primary-200 font-bold">
              {getDuration(trace.start_timestamp, trace.timestamp).toLocaleString()} ms
            </strong>{' '}
            recorded in{' '}
            <strong className="text-primary-200 font-bold">{trace.spans.length.toLocaleString()} spans</strong>
          </span>
        </div>
      </div>
      <div className="bg-primary-950 text-primary-50 border-primary-600 hover:border-primary-500 relative mx-6 mb-4 mt-2 flex h-auto w-auto gap-2 rounded-md border py-1 pl-4 pr-6 outline-none transition-all">
        <input
          type="text"
          className="text-primary-50 h-auto w-full flex-1 bg-transparent outline-none transition-all"
          onChange={handleSearch}
          value={query}
          placeholder="Search in Trace"
        />
        {query && (
          <CrossIcon
            onClick={handleResetSearch}
            className="fill-primary-50 absolute right-1 top-[5px] cursor-pointer"
            height={20}
            width={20}
          />
        )}
      </div>
      <div className="flex-1 px-2 pb-6">
        <SpanTree
          traceContext={trace}
          tree={trace.spanTree}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          totalTransactions={(trace.transactions || []).length}
          spanNodeWidth={spanNodeWidth}
          setSpanNodeWidth={setSpanNodeWidth}
          query={debouncedQuery}
        />
      </div>
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
