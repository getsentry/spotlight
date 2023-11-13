import { useParams } from 'react-router-dom';
import useKeyPress from '~/lib/useKeyPress';
import { useNavigation } from '~/lib/useNavigation';
import dataCache from '../data/sentryDataCache';
import { getDuration } from '../utils/duration';
import DateTime from './DateTime';
import PlatformIcon from './PlatformIcon';
import SpanDetails from './SpanDetails';
import SpanTree from './SpanTree';

export default function TraceDetails() {
  useKeyPress('Escape', () => {
    setTraceId(null);
  });
  const { traceId } = useParams();
  const { spanId, setTraceId } = useNavigation();

  if (!traceId) {
    return <p>Unknown trace id</p>;
  }

  const trace = dataCache.getTraceById(traceId);
  const span = spanId ? dataCache.getSpanById(trace.trace_id, spanId) : undefined;

  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  return (
    <>
      <div className="flex items-center gap-x-2 bg-indigo-950 px-6  py-4">
        <PlatformIcon platform={trace.rootTransaction?.platform} />
        <h1 className="max-w-full flex-1 truncate text-2xl">{trace.rootTransactionName}</h1>
        <div className="font-mono text-indigo-300">
          <div>T: {trace.trace_id}</div>
          <div>S: {trace.span_id}</div>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="flex flex-1 items-center gap-x-1 text-indigo-300">
          <div className="text-indigo-200">
            <DateTime date={trace.start_timestamp} />
          </div>
          <span>&mdash;</span>
          <span>
            <strong className="font-bold text-indigo-200">
              {getDuration(trace.start_timestamp, trace.timestamp).toLocaleString()} ms
            </strong>{' '}
            recorded in{' '}
            <strong className="font-bold text-indigo-200">{trace.spans.length.toLocaleString()} spans</strong>
          </span>
        </div>
      </div>
      <div className="flex-1 divide-indigo-500 bg-indigo-950 px-6 py-4">
        <SpanTree
          traceContext={trace}
          tree={trace.spanTree}
          startTimestamp={startTimestamp}
          totalDuration={totalDuration}
        />

        {span ? (
          <SpanDetails traceContext={trace} startTimestamp={startTimestamp} totalDuration={totalDuration} span={span} />
        ) : null}
      </div>
    </>
  );
}
