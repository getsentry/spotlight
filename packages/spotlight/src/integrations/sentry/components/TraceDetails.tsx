import useKeyPress from '~/lib/useKeyPress';
import SpanDetails from './SpanDetails';
import SpanTree from './SpanTree';
import DateTime from './DateTime';
import PlatformIcon from './PlatformIcon';
import { useNavigation } from '~/lib/useNavigation';
import dataCache from '../data/sentryDataCache';
import { Trace } from '~/types';
import { getDuration } from '../utils/duration';

export default function TraceDetails({ trace }: { trace: Trace }) {
  useKeyPress('Escape', () => {
    setTraceId(null);
  });

  const { spanId, setTraceId } = useNavigation();

  const span = spanId ? dataCache.getSpanById(trace.trace_id, spanId) : undefined;

  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  return (
    <>
      <div className="px-6 py-4 flex gap-x-2 bg-indigo-950  items-center">
        <PlatformIcon platform={trace.rootTransaction?.platform} />
        <h1 className="text-2xl max-w-full truncate flex-1">{trace.rootTransactionName}</h1>
        <div className="font-mono text-indigo-300">
          <div>T: {trace.trace_id}</div>
          <div>S: {trace.span_id}</div>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="flex flex-1 items-center text-indigo-300 gap-x-1">
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
      <div className="divide-indigo-500 flex-1 bg-indigo-950 px-6 py-4">
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
