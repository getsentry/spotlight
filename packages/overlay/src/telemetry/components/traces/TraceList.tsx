import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import CardList from "~/telemetry/components/shared/CardList";
import { TraceSplitViewLayout } from "../../tabs/TracesTab";
import type { Trace } from "../../types";
import HiddenItemsButton from "../shared/HiddenItemsButton";
import TraceItem from "./TraceItem";

type TraceListProps = {
  traceData: {
    filtered: Trace[];
    all: Trace[];
    visible: Trace[];
    hiddenItemCount: number;
  };
  onShowAll: () => void;
};

export default function TraceList({ traceData, onShowAll }: TraceListProps) {
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
    return <div className="text-primary-300 p-6">Looks like there are no traces recorded matching this query. 🤔</div>;
  }

  return (
    <CardList>
      {traceData.hiddenItemCount > 0 ? (
        <HiddenItemsButton itemCount={traceData.hiddenItemCount} onClick={onShowAll} />
      ) : null}
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
        <div className="text-primary-300 p-6">
          Looks like there are no traces recorded matching the applied search & filters. 🤔
        </div>
      )}
    </CardList>
  );
}
