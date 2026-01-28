import CardList from "@spotlight/ui/telemetry/components/shared/CardList";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { TraceSplitViewLayout } from "../../tabs/TracesTab";
import type { Trace } from "../../types";
import EmptyState from "../shared/EmptyState";
import TraceItem from "./TraceItem";

type TraceListProps = {
  traceData: {
    filtered: Trace[];
    all: Trace[];
  };
};

export default function TraceList({ traceData }: TraceListProps) {
  const [aiMode, setAiMode] = useState(false);
  const onToggle = useCallback(() => {
    setAiMode(prev => !prev);
  }, []);
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();
  const selectedTraceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (traceId && selectedTraceRef.current) {
      selectedTraceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [traceId]);

  if (traceData.all.length === 0) {
    return (
      <EmptyState
        variant="full"
        className="h-full"
        title="No Traces"
        description="No traces yet. Once you instrument your app with Sentry, they'll show up here."
        showDocsLink
      />
    );
  }

  return (
    <CardList>
      {traceData.filtered.length > 0 ? (
        traceData.filtered.map(trace => {
          const isSelected = traceId === trace.trace_id;
          const ref = isSelected ? selectedTraceRef : null;

          return (
            <div key={trace.trace_id} id={trace.trace_id} ref={ref}>
              {isSelected ? (
                <TraceSplitViewLayout
                  trace={trace}
                  span={spanId ? trace.spans.get(spanId) : undefined}
                  aiConfig={{
                    mode: aiMode,
                    onToggle,
                  }}
                />
              ) : (
                <TraceItem trace={trace} />
              )}
            </div>
          );
        })
      ) : (
        <EmptyState description="No traces match your current filters." />
      )}
    </CardList>
  );
}
