import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import CardList from "../../../../components/CardList";
import useSentryStore from "../../store";
import type { Trace } from "../../types";
import AITranscription from "../insights/aiTraces/AITranscription";
import { hasAISpans } from "../insights/aiTraces/sdks/aiLibraries";
import HiddenItemsButton from "../shared/HiddenItemsButton";
import TraceTreeview from "./TraceDetails/components/TraceTreeview";
import TraceItem from "./TraceItem";

type TraceListProps = {
  traceData: {
    filtered: Trace[];
    all: Trace[];
    visible: Trace[];
    hiddenItemCount: number;
  };
  displayConfig: {
    aiMode: boolean;
    hideSelectedInline?: boolean;
  };
  onShowAll: () => void;
};

export default function TraceList({ traceData, displayConfig, onShowAll }: TraceListProps) {
  const { traceId } = useParams<{ traceId: string }>();
  const getTraceById = useSentryStore(state => state.getTraceById);
  const selectedTraceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (traceId && selectedTraceRef.current) {
      selectedTraceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [traceId]);

  return (
    <>
      {traceData.all.length !== 0 ? (
        <CardList>
          {traceData.hiddenItemCount > 0 && (
            <HiddenItemsButton itemCount={traceData.hiddenItemCount} onClick={onShowAll} />
          )}
          {traceData.filtered.map(trace => {
            const isSelected = traceId === trace.trace_id;
            const traceData = getTraceById(trace.trace_id);
            const isAITrace = traceData ? hasAISpans(traceData) : false;

            // TODO: For this #<traceId> link to work as intended, we need to do something like this:
            //       https://dev.to/mindactuate/scroll-to-anchor-element-with-react-router-v6-38op
            return (
              <div key={trace.trace_id} ref={isSelected ? selectedTraceRef : null}>
                <TraceItem trace={trace} isSelected={isSelected} />

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
