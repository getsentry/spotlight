import { useState } from 'react';
import { useParams } from 'react-router-dom';
import sentryDataCache from '../../../../../data/sentryDataCache';
import DateTime from '../../../../DateTime';
import SpanDetails from '../../spans/SpanDetails';
import SpanTree from '../../spans/SpanTree';
import { getFormattedSpanDuration } from '../../../../../utils/duration';

type TraceTreeViewProps = { traceId: string };

export const DEFAULT_SPAN_NODE_WIDTH = 50;

export default function TraceTreeview({ traceId }: TraceTreeViewProps) {
  const { spanId } = useParams();

  const [spanNodeWidth, setSpanNodeWidth] = useState<number>(DEFAULT_SPAN_NODE_WIDTH);

  const trace = sentryDataCache.getTraceById(traceId);
  const span = spanId ? sentryDataCache.getSpanById(traceId, spanId) : undefined;
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
    </>
  );
}
