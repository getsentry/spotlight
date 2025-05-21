import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactComponent as Sort } from '~/assets/sort.svg';
import { ReactComponent as SortDown } from '~/assets/sortDown.svg';
import classNames from '~/lib/classNames';
import Table from '~/ui/Table';
import { AGENT_HEADERS, AGENT_SORT_KEYS } from '../../../constants';
import { SearchProvider } from '../../../context/SearchContext';
import { useAISpansWithDescendants, useProcessedAITraces, type ProcessedAITrace } from '../../../data/useSentryAISpans';
import useSort from '../../../hooks/useSort';
import useSentryStore from '../../../store';
import AISpanDetails from './AISpanDetails';
import AITraceItem from './AITraceItem';

type AgentSortTypes = (typeof AGENT_SORT_KEYS)[keyof typeof AGENT_SORT_KEYS];
type AgentComparator = (a: ProcessedAITrace, b: ProcessedAITrace) => number;

const COMPARATORS: Record<AgentSortTypes, AgentComparator> = {
  [AGENT_SORT_KEYS.timestamp]: (a, b) => a.timestamp - b.timestamp,
  [AGENT_SORT_KEYS.duration]: (a, b) => a.durationMs - b.durationMs,
  [AGENT_SORT_KEYS.traceId]: (a, b) => a.id.localeCompare(b.id),
  [AGENT_SORT_KEYS.name]: (a, b) => a.name.localeCompare(b.name),
  [AGENT_SORT_KEYS.tokens]: (a, b) => {
    const aPrompt = a.promptTokens ?? 0;
    const bPrompt = b.promptTokens ?? 0;
    if (aPrompt !== bPrompt) {
      return aPrompt - bPrompt;
    }
    return (a.completionTokens ?? 0) - (b.completionTokens ?? 0);
  },
  [AGENT_SORT_KEYS.operation]: (a, b) => a.operation.localeCompare(b.operation),
};

export default function AgentList() {
  const { spanId } = useParams<{ spanId?: string }>();
  const navigate = useNavigate();
  const allAiSpans = useAISpansWithDescendants();
  const getTraceById = useSentryStore(state => state.getTraceById);
  const processedAiTraces = useProcessedAITraces();

  const { sort, toggleSortOrder } = useSort({ defaultSortType: AGENT_SORT_KEYS.timestamp });

  const sortedAiTraces = useMemo(() => {
    const compareFn = COMPARATORS[sort.active as AgentSortTypes] || COMPARATORS[AGENT_SORT_KEYS.timestamp];
    return [...processedAiTraces].sort((a, b) => {
      return sort.asc ? compareFn(a, b) : compareFn(b, a);
    });
  }, [processedAiTraces, sort]);

  const selectedRawSpan = spanId ? allAiSpans.find(s => s.span_id === spanId) : null;
  const traceContext = selectedRawSpan?.trace_id ? getTraceById(selectedRawSpan.trace_id) : null;

  if (processedAiTraces.length === 0) {
    return <div className="text-primary-300 p-6">No AI traces have been recorded yet. 🤔</div>;
  }

  const handleTraceClick = (trace: ProcessedAITrace) => {
    if (trace.id) {
      navigate(`../${trace.id}`);
    } else {
      console.warn('Clicked trace does not have an ID for details view.');
    }
  };

  return (
    <>
      <Table variant="detail">
        <Table.Header>
          <tr>
            {AGENT_HEADERS.map(header => (
              <th
                key={header.id}
                scope="col"
                className={classNames('text-primary-100 px-6 py-3.5 text-left text-sm font-semibold')}
              >
                <div
                  className={classNames('flex cursor-pointer select-none items-center gap-1')}
                  onClick={() => header.sortKey && toggleSortOrder(header.sortKey as AgentSortTypes)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ' ') && header.sortKey) {
                      toggleSortOrder(header.sortKey as AgentSortTypes);
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
                      className={classNames(
                        'fill-primary-300',
                        sort.asc ? '-translate-y-0.5 rotate-0' : 'translate-y-0.5 rotate-180',
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
          <AISpanDetails
            span={selectedRawSpan}
            traceContext={traceContext}
            startTimestamp={traceContext.start_timestamp}
            totalDuration={traceContext.timestamp - traceContext.start_timestamp}
          />
        </SearchProvider>
      )}
    </>
  );
}
