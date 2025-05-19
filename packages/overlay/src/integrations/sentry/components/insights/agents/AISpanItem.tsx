import { Link } from 'react-router-dom';
import type { Span } from '../../../types';
import DateTime from '../../shared/DateTime';

export default function AISpanItem({ span }: { span: Span }) {
  if (!span.trace_id) {
    return (
      <div className="block p-2 text-red-500">
        Invalid AI Span (missing trace_id): {span.description || span.span_id}
      </div>
    );
  }

  return (
    <Link to={`/insights/agents/${span.span_id}`} className="hover:bg-primary-900 block cursor-pointer p-2">
      {span.description || `AI Span ${span.span_id.substring(0, 8)}`} - <DateTime date={span.timestamp} />
    </Link>
  );
}
