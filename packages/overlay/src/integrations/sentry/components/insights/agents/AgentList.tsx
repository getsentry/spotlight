import useAiSpansWithDescendants from '../../traces/spans/useAiSpans';

export default function AgentList() {
  // TODO: make sure we don't really need to take into account local spans
  const allAiSpans = useAiSpansWithDescendants();

  return (
    <>
      {allAiSpans.length !== 0 ? (
        <div>
          {allAiSpans.map(span => {
            return (
              <div key={span.span_id}>
                <div key={span.span_id}>{span.description}</div>
                TEST
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-primary-300 p-6">No AI traces have been recorded yet. 🤔</div>
      )}
    </>
  );
}
