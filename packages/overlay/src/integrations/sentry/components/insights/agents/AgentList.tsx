import { Link } from 'react-router-dom';
import useAiSpansWithDescendants from '../../traces/spans/useAiSpans';

export default function AgentList() {
  // TODO: make sure we don't really need to take into account local spans
  const allAiSpans = useAiSpansWithDescendants();

  return (
    <>
      {allAiSpans.length !== 0 ? (
        <div>
          {allAiSpans.map(span => {
            //TODO: check if trace_id is present
            return (
              <Link
                key={span.span_id}
                to={`/traces/${span.trace_id}/spans/${span.span_id}`}
                className="hover:bg-primary-900 block cursor-pointer p-2"
              >
                {span.description} {span.timestamp}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-primary-300 p-6">No AI traces have been recorded yet. 🤔</div>
      )}
    </>
  );
}
