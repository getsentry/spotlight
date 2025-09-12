import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactComponent as Sort } from "~/assets/sort.svg";
import { ReactComponent as SortDown } from "~/assets/sortDown.svg";
import { cn } from "~/lib/cn";
import type { SpotlightAITrace } from "~/telemetry/types";
import Table from "~/ui/table";
import { AI_TRACES_HEADERS, AI_TRACES_SORT_KEYS } from "../../../constants";
import { SearchProvider } from "../../../context/SearchContext";
import { useSpotlightAITraces } from "../../../data/useSpotlightAITraces";
import useSort from "../../../hooks/useSort";
import useSentryStore from "../../../store";
import AITraceDetail from "./AITraceDetails";
import AITraceItem from "./AITraceItem";

type AITracesSortTypes = (typeof AI_TRACES_SORT_KEYS)[keyof typeof AI_TRACES_SORT_KEYS];
type AITracesComparator = (a: SpotlightAITrace, b: SpotlightAITrace) => number;

const COMPARATORS: Record<AITracesSortTypes, AITracesComparator> = {
  [AI_TRACES_SORT_KEYS.timestamp]: (a, b) => a.timestamp - b.timestamp,
  [AI_TRACES_SORT_KEYS.duration]: (a, b) => a.durationMs - b.durationMs,
  [AI_TRACES_SORT_KEYS.traceId]: (a, b) => a.id.localeCompare(b.id),
  [AI_TRACES_SORT_KEYS.name]: (a, b) => a.name.localeCompare(b.name),
  [AI_TRACES_SORT_KEYS.tokens]: (a, b) => {
    const aPrompt = a.promptTokens ?? 0;
    const bPrompt = b.promptTokens ?? 0;
    if (aPrompt !== bPrompt) {
      return aPrompt - bPrompt;
    }
    return (a.completionTokens ?? 0) - (b.completionTokens ?? 0);
  },
  [AI_TRACES_SORT_KEYS.operation]: (a, b) => a.operation.localeCompare(b.operation),
};

export default function AITraceList() {
  const { traceId, spanId } = useParams<{ traceId?: string; spanId?: string }>();
  const navigate = useNavigate();
  const getTraceById = useSentryStore(state => state.getTraceById);
  const spotlightAITraces = useSpotlightAITraces();

  const { sort, toggleSortOrder } = useSort({ defaultSortType: AI_TRACES_SORT_KEYS.timestamp });

  const sortedAiTraces = useMemo(() => {
    const compareFn = COMPARATORS[sort.active as AITracesSortTypes] || COMPARATORS[AI_TRACES_SORT_KEYS.timestamp];
    return [...spotlightAITraces].sort((a, b) => {
      return sort.asc ? compareFn(a, b) : compareFn(b, a);
    });
  }, [spotlightAITraces, sort]);

  const traceContext = traceId ? getTraceById(traceId) : null;
  const selectedRawSpan = spanId ? traceContext?.spans.get(spanId) : null;

  if (spotlightAITraces.length === 0) {
    return <div className="text-primary-300 p-6">No AI traces have been recorded yet. 🤔</div>;
  }

  const handleTraceClick = (trace: SpotlightAITrace) => {
    if (trace.id) {
      navigate(`/telemetry/insights/aitraces/${trace.id}`);
    }
  };

  return (
    <>
      <Table variant="detail">
        <Table.Header>
          <tr>
            {AI_TRACES_HEADERS.map(header => (
              <th
                key={header.id}
                scope="col"
                className={cn(
                  "text-primary-100 px-6 py-3.5 text-sm font-semibold",
                  header.id === "duration" || header.id === "tokens" ? "text-right" : "text-left",
                )}
              >
                <div
                  className={cn(
                    "flex cursor-pointer select-none items-center gap-1",
                    header.id === "duration" || header.id === "tokens" ? "justify-end" : "",
                  )}
                  onClick={() => header.sortKey && toggleSortOrder(header.sortKey as AITracesSortTypes)}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === " ") && header.sortKey) {
                      toggleSortOrder(header.sortKey as AITracesSortTypes);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                  {header.title}
                  {header.sortKey && sort.active === header.sortKey ? (
                    <SortDown
                      width={12}
                      height={12}
                      className={cn(
                        "fill-primary-300",
                        sort.asc ? "-translate-y-0.5 rotate-0" : "translate-y-0.5 rotate-180",
                      )}
                    />
                  ) : (
                    header.sortKey && <Sort width={12} height={12} className="stroke-primary-300" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </Table.Header>
        <Table.Body>
          {sortedAiTraces.map(trace => {
            return <AITraceItem key={trace.id} trace={trace} onClick={() => handleTraceClick(trace)} />;
          })}
        </Table.Body>
      </Table>

      {selectedRawSpan && traceContext && (
        <SearchProvider>
          <AITraceDetail />
        </SearchProvider>
      )}
    </>
  );
}
