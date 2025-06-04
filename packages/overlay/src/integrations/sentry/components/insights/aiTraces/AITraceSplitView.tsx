import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Trace } from "~/integrations/sentry/types";
import useSentryStore from "../../../store";
import { AITraceDetailsEmbedded } from "./AITraceDetails";
import AITraceFlow from "./AITraceFlow";
import { extractAllAIRootSpans } from "./sdks/aiLibraries";

type AITraceSplitViewProps = {
  traceId: string;
};

// Get the first AI span ID from the trace
function getFirstAISpanId(trace: Trace): string | null {
  if (!trace.spanTree) {
    return null;
  }
  const aiRootSpans = extractAllAIRootSpans(trace.spanTree);
  if (aiRootSpans.length > 0) {
    const spanId = aiRootSpans[0].span.span_id;
    return spanId;
  }
  return null;
}

export default function AITraceSplitView({ traceId }: AITraceSplitViewProps) {
  const { spanId } = useParams<{ spanId?: string }>();
  const navigate = useNavigate();
  const getTraceById = useSentryStore(state => state.getTraceById);

  const trace = getTraceById(traceId);
  const firstAISpanId = trace ? getFirstAISpanId(trace) : null;

  // auto-navigate to first AI span when no span is selected
  useEffect(() => {
    if (!spanId && firstAISpanId) {
      navigate(`/traces/${traceId}/spans/${firstAISpanId}`, { replace: true });
    }
  }, [spanId, firstAISpanId, traceId, navigate]);

  // use selected spanId if available, otherwise fall back to first AI span
  const selectedSpanId = spanId || firstAISpanId;

  if (!selectedSpanId) {
    return (
      <div className="p-6">
        <p className="text-red-400">No AI span found in this trace</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* left panel - AI flow */}
      <div className="border-primary-700 flex min-h-0 w-2/5 flex-col border-r">
        <AITraceFlow traceId={traceId} />
      </div>

      {/* right panel - AI details */}
      <div className="flex min-h-0 w-3/5 flex-col">
        <AITraceDetailsEmbedded spanId={selectedSpanId} />
      </div>
    </div>
  );
}
