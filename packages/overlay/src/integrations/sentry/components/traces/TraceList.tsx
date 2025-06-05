import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "~/ui/badge";
import CardList from "../../../../components/CardList";
import TimeSince from "../../../../components/TimeSince";
import classNames from "../../../../lib/classNames";
import { useSpotlightContext } from "../../../../lib/useSpotlightContext";
import { useSentryTraces } from "../../data/useSentrySpans";
import useTraceFiltering from "../../hooks/useTraceFiltering";
import useSentryStore from "../../store";
import { isLocalTrace } from "../../store/helpers";
import { getFormattedSpanDuration } from "../../utils/duration";
import { truncateId } from "../../utils/text";
import AITranscription from "../insights/aiTraces/AITranscription";
import { hasAISpans } from "../insights/aiTraces/sdks/aiLibraries";
import HiddenItemsButton from "../shared/HiddenItemsButton";
import { TraceRootTxnName } from "./TraceDetails/components/TraceRootTxnName";
import TraceTreeview from "./TraceDetails/components/TraceTreeview";
import TraceIcon from "./TraceIcon";
import TraceListFilter from "./TraceListFilter";

type TraceListProps = {
  aiMode: boolean;
};

export default function TraceList({ aiMode }: TraceListProps) {
  const { traceId, spanId } = useParams<{ traceId: string; spanId: string }>();
  const { allTraces, localTraces } = useSentryTraces();
  const context = useSpotlightContext();
  const getTraceById = useSentryStore(state => state.getTraceById);
  const selectedTraceRef = useRef<HTMLDivElement>(null);

  const [showAll, setShowAll] = useState(!context.experiments["sentry:focus-local-events"]);
  const visibleTraces = showAll ? allTraces : localTraces;
  const hiddenItemCount = allTraces.length - visibleTraces.length;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const { TRACE_FILTER_CONFIGS, filteredTraces } = useTraceFiltering(visibleTraces, activeFilters, searchQuery);

  // Auto-scroll to selected trace
  useEffect(() => {
    if (traceId && selectedTraceRef.current) {
      selectedTraceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [traceId]);

  return (
    <>
      {visibleTraces.length !== 0 ? (
        <CardList>
          {hiddenItemCount > 0 && (
            <HiddenItemsButton
              itemCount={hiddenItemCount}
              onClick={() => {
                setShowAll(true);
              }}
            />
          )}
          <TraceListFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            filterConfigs={TRACE_FILTER_CONFIGS}
          />
          <div className="overflow-y-auto overflow-x-hidden">
            {filteredTraces.map(trace => {
              const traceContent = (
                <>
                  <TraceIcon trace={trace} />
                  <div className="text-primary-300 flex w-48 flex-col truncate font-mono text-sm">
                    <div className="flex items-center gap-x-2">
                      <div>{truncateId(trace.trace_id)}</div>
                      {isLocalTrace(trace.trace_id) ? (
                        <Badge title="This trace is part of your local session.">Local</Badge>
                      ) : null}
                    </div>
                    <TimeSince date={trace.start_timestamp} />
                  </div>
                  <TraceRootTxnName trace={trace} />
                  <div className="flex flex-col truncate font-mono">
                    <div className="text-primary-300 flex space-x-2 text-sm">
                      {trace.status && (
                        <>
                          <div
                            className={classNames(
                              trace.status === "ok" ? "text-green-400" : trace.status ? "text-red-400" : "",
                            )}
                          >
                            {trace.status}
                          </div>
                          <div>&mdash;</div>
                        </>
                      )}
                      <div>{getFormattedSpanDuration(trace)}</div>
                      <div>&mdash;</div>
                      <div>
                        {trace.spans.size.toLocaleString()} spans, {trace.transactions.length.toLocaleString()} txns
                      </div>
                    </div>
                  </div>
                </>
              );

              const isSelected = traceId === trace.trace_id;
              const traceData = getTraceById(trace.trace_id);
              const isAITrace = traceData ? hasAISpans(traceData) : false;

              // TODO: For this #<traceId> link to work as intended, we need to do something like this:
              //       https://dev.to/mindactuate/scroll-to-anchor-element-with-react-router-v6-38op
              return (
                <div key={trace.trace_id} ref={isSelected ? selectedTraceRef : null}>
                  <Link
                    className="hover:bg-primary-900 flex cursor-pointer items-center gap-x-4 px-6 py-2"
                    to={isSelected && !spanId ? `../#${trace.trace_id}` : `/traces/${trace.trace_id}/context`}
                    id={trace.trace_id}
                  >
                    {traceContent}
                  </Link>

                  {/* Inline content below selected trace */}
                  {isSelected && (
                    <div className="border-l-primary-500 bg-primary-950 mb-4 border-l-4">
                      {aiMode && isAITrace ? (
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
            {filteredTraces?.length === 0 && (
              <div className="text-primary-300 p-6">
                Looks like there are no traces recorded matching the applied search & filters. 🤔
              </div>
            )}
          </div>
        </CardList>
      ) : (
        <div className="text-primary-300 p-6">Looks like there are no traces recorded matching this query. 🤔</div>
      )}
    </>
  );
}
