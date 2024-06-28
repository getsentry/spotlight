import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import dataCache from '../../../data/sentryDataCache';
import { getDuration } from '../../../utils/duration';
import DateTime from '../../DateTime';
import SpanDetails from '../spans/SpanDetails';
import SpanTree from '../spans/SpanTree';
import TraceInfo from '../traceInfo';
import TraceDetailHeader from './TraceDetailHeader';

export default function TraceDetails() {
  const { traceId, spanId } = useParams();
  const { pathname } = useLocation();

  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(50);

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
  const isTraceInfo = pathname === `/traces/${traceId}/info`;
  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  return (
    <>
      <TraceDetailHeader trace={trace} />
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
      <div className="flex-1 px-2 pb-6">
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
      {span ? (
        <SpanDetails
          traceContext={trace}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
          span={span}
          totalTransactions={(trace.transactions || []).length}
        />
      ) : null}

      {isTraceInfo && <TraceInfo traceContext={trace} />}
    </>
  );
}
