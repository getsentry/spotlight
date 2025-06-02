import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReactComponent as CrossIcon } from '~/assets/cross.svg';
import { SearchProvider, useSearch } from '~/integrations/sentry/context/SearchContext';
import useSearchInput from '~/integrations/sentry/hooks/useSearchInput';
import useSentryStore from '~/integrations/sentry/store';
import type { SpotlightAITrace } from '~/integrations/sentry/types';
import { getFormattedDuration } from '~/integrations/sentry/utils/duration';
import classNames from '~/lib/classNames';
import DateTime from '../../shared/DateTime';
import { createAITraceFromSpan, extractAllAIRootSpans } from './sdks/aiLibraries';

type AITraceFlowProps = {
  traceId: string;
};

function AIFlowItem({
  aiTrace,
  isSelected,
  traceId,
  index,
  total,
}: {
  aiTrace: SpotlightAITrace;
  isSelected: boolean;
  traceId: string;
  index: number;
  total: number;
}) {
  const isLast = index === total - 1;

  return (
    <div className="relative">
      {/* connection line to next item */}
      {!isLast && <div className="bg-primary-600 absolute left-4 top-12 z-0 h-16 w-0.5" />}

      {/* Flow item */}
      <Link
        to={`/traces/${traceId}/spans/${aiTrace.id}`}
        className={classNames(
          'relative z-10 block flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all',
          isSelected
            ? 'bg-primary-800 border-primary-500'
            : 'bg-primary-900 border-primary-700 hover:bg-primary-800 hover:border-primary-600',
        )}
      >
        {/* flow indicator dot */}
        <div
          className={classNames(
            'mt-2 h-2 w-2 flex-shrink-0 rounded-full',
            isSelected ? 'bg-blue-400' : 'bg-primary-400',
          )}
        />

        {/* content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className={classNames('truncate font-medium', isSelected ? 'text-primary-100' : 'text-primary-200')}>
              {aiTrace.name}
            </h3>
            <span
              className={classNames(
                'rounded px-2 py-0.5 text-xs',
                aiTrace.hasToolCall ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300',
              )}
            >
              {aiTrace.hasToolCall ? 'Tool Call' : aiTrace.operation.replace('ai.', '')}
            </span>
          </div>

          <div className="text-primary-400 flex items-center gap-4 text-xs">
            <span>{getFormattedDuration(aiTrace.durationMs)}</span>
            <span>{aiTrace.tokensDisplay}</span>
          </div>

          {aiTrace.hasToolCall && aiTrace.toolCalls.length > 0 && (
            <div className="text-primary-300 mt-2 text-xs">
              Tools: {aiTrace.toolCalls.map(tool => tool.toolName).join(', ')}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function AITraceFlowWithSearch({ aiTraces, traceId }: { aiTraces: SpotlightAITrace[]; traceId: string }) {
  const { setQuery } = useSearch();
  const { inputValue, showReset, handleChange, handleReset } = useSearchInput(setQuery, 500);
  const { spanId } = useParams();

  const filteredAITraces = useMemo(() => {
    if (!inputValue) return aiTraces;

    const searchLower = inputValue.toLowerCase();
    return aiTraces.filter(
      aiTrace =>
        aiTrace.name.toLowerCase().includes(searchLower) ||
        aiTrace.operation.toLowerCase().includes(searchLower) ||
        aiTrace.toolCalls.some(tool => tool.toolName.toLowerCase().includes(searchLower)),
    );
  }, [aiTraces, inputValue]);

  if (aiTraces.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-primary-300">No AI interactions found in this trace</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-6 mb-4 mt-2 flex gap-2">
        <div className="bg-primary-950 text-primary-50 border-primary-600 hover:border-primary-500 relative flex h-auto w-full flex-1 gap-2 rounded-md border py-1 pl-4 pr-6 outline-none transition-all">
          <input
            className="text-primary-50 h-auto w-full flex-1 bg-transparent outline-none transition-all"
            onChange={handleChange}
            value={inputValue}
            placeholder="Search AI interactions..."
          />
          {showReset && (
            <CrossIcon
              onClick={handleReset}
              className="fill-primary-50 absolute right-1 top-[5px] cursor-pointer"
              height={20}
              width={20}
            />
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 ">
        <div className="space-y-4">
          {filteredAITraces.map((aiTrace, index) => (
            <AIFlowItem
              key={aiTrace.id}
              aiTrace={aiTrace}
              isSelected={spanId === aiTrace.id}
              traceId={traceId}
              index={index}
              total={filteredAITraces.length}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function AITraceFlowContent({ traceId }: AITraceFlowProps) {
  const getTraceById = useSentryStore(state => state.getTraceById);

  const trace = getTraceById(traceId)!;
  const startTimestamp = trace.start_timestamp;
  const totalDuration = trace.timestamp - startTimestamp;

  // extract AI traces from the trace
  const aiTraces = useMemo(() => {
    if (!trace.spanTree) return [];

    const aiRootSpans = extractAllAIRootSpans(trace.spanTree);
    return aiRootSpans
      .map(({ span }) => createAITraceFromSpan(span))
      .filter((aiTrace): aiTrace is SpotlightAITrace => aiTrace !== null)
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
  }, [trace]);

  return (
    <>
      <div className="px-6 py-4">
        <div className="text-primary-300 flex flex-1 items-center gap-x-1">
          <div className="text-primary-200">
            <DateTime date={trace.start_timestamp} />
          </div>
          <span>&mdash;</span>
          <span>
            <strong className="text-primary-200 font-bold">{getFormattedDuration(totalDuration)}</strong> with{' '}
            <strong className="text-primary-200 font-bold">
              {aiTraces.length} AI interaction{aiTraces.length !== 1 ? 's' : ''}
            </strong>
          </span>
        </div>
      </div>
      <AITraceFlowWithSearch aiTraces={aiTraces} traceId={traceId} />
    </>
  );
}

export default function AITraceFlow(props: AITraceFlowProps) {
  return (
    <SearchProvider>
      <AITraceFlowContent {...props} />
    </SearchProvider>
  );
}
