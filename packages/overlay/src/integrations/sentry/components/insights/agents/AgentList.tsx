import { useParams } from 'react-router-dom';
import useAiSpansWithDescendants from '../../../data/useSentryAISpans';
import useSentryStore from '../../../store';
import AISpanDetails from './AISpanDetails';
import AISpanItem from './AISpanItem';

export default function AgentList() {
  const { spanId } = useParams<{ spanId?: string }>();
  const allAiSpans = useAiSpansWithDescendants();
  const getTraceById = useSentryStore(state => state.getTraceById);

  const selectedSpan = spanId ? allAiSpans.find(s => s.span_id === spanId) : null;
  const traceContext = selectedSpan?.trace_id ? getTraceById(selectedSpan.trace_id) : null;

  if (allAiSpans.length === 0) {
    return <div className="text-primary-300 p-6">No AI traces have been recorded yet. 🤔</div>;
  }

  return (
    <>
      <div>
        {allAiSpans.map(span => {
          if (!span || !span.span_id) {
            console.warn('Rendering list: Encountered an AI span without a span_id.');
            return null;
          }
          return <AISpanItem key={span.span_id} span={span} />;
        })}
      </div>

      {selectedSpan && traceContext && (
        <AISpanDetails
          span={selectedSpan}
          traceContext={traceContext}
          startTimestamp={traceContext.start_timestamp}
          totalDuration={traceContext.timestamp - traceContext.start_timestamp}
        />
      )}
    </>
  );
}
