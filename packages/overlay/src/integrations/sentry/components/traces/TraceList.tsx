import { useEffect, useRef } from "react";
import CardList from "../../../../components/CardList";
import useSentryStore from "../../store";
import type { Trace } from "../../types";
import AITranscription from "../insights/aiTraces/AITranscription";
import { hasAISpans } from "../insights/aiTraces/sdks/aiLibraries";
import HiddenItemsButton from "../shared/HiddenItemsButton";
import TraceTreeview from "./TraceDetails/components/TraceTreeview";
import TraceItem from "./TraceItem";

type TraceListProps = {
  onTraceSelect?: (traceId: string) => void;
  selectedTraceId?: string;
  traceData: {
    filtered: Trace[];
    all: Trace[];
    visible: Trace[];
  };
  displayConfig: {
    aiMode: boolean;
    hideSelectedInline?: boolean;
  };
  onShowAll: () => void;
};

export default function TraceList({
  onTraceSelect,
  selectedTraceId,
  traceData,
  displayConfig,
  onShowAll,
}: TraceListProps) {
  const getTraceById = useSentryStore(state => state.getTraceById);
  const selectedTraceRef = useRef<HTMLDivElement>(null);

  const hiddenItemCount = traceData.all.length - traceData.visible.length;

  useEffect(() => {
    if (selectedTraceId && selectedTraceRef.current) {
      selectedTraceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedTraceId]);

  return (
    <>
      {traceData.all.length !== 0 ? (
        <CardList>
          {hiddenItemCount > 0 && <HiddenItemsButton itemCount={hiddenItemCount} onClick={onShowAll} />}
          {traceData.filtered.map(trace => {
            const isSelected = selectedTraceId === trace.trace_id;
            const traceData = getTraceById(trace.trace_id);
            const isAITrace = traceData ? hasAISpans(traceData) : false;

            return (
              <div key={trace.trace_id} ref={isSelected ? selectedTraceRef : null}>
                {onTraceSelect ? (
                  <TraceItem trace={trace} isSelected={isSelected} onClick={() => onTraceSelect(trace.trace_id)} />
                ) : (
                  <TraceItem
                    trace={trace}
                    isSelected={isSelected}
                    asLink={true}
                    href={`/traces/${trace.trace_id}/context`}
                  />
                )}

                {/* Inline content below selected trace */}
                {isSelected && !displayConfig.hideSelectedInline && (
                  <div className="border-l-primary-500 bg-primary-950 mb-4 border-l-4">
                    {displayConfig.aiMode && isAITrace ? (
                      <AITranscription traceId={trace.trace_id} />
                    ) : (
                      <div className="px-2">
                        <TraceTreeview traceId={trace.trace_id} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {traceData.filtered?.length === 0 && (
            <div className="text-primary-300 p-6">
              Looks like there are no traces recorded matching the applied search & filters. 🤔
            </div>
          )}
        </CardList>
      ) : (
        <div className="text-primary-300 p-6">Looks like there are no traces recorded matching this query. 🤔</div>
      )}
    </>
  );
}
