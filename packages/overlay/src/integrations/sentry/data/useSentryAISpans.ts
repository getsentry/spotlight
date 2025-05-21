import { useMemo } from 'react';
import { useSentryTraces } from '~/integrations/sentry/data/useSentrySpans';
import type { Span, SpanId } from '~/integrations/sentry/types';

const AI_SPAN_DESCRIPTION_PREFIX = 'ai'; // all spans that start with this prefix are from the vercel ai sdk https://ai-sdk.dev/docs/ai-sdk-core/telemetry

export interface ProcessedAITrace {
  id: string; // root span_id, also used as traceId for display
  name: string; // root span description or op for primary display
  operation: string; // e.g., from span.data['ai.operationId'] like 'ai.generateText'
  timestamp: number;
  durationMs: number;
  tokensDisplay: string; // prompt/completion or N/A
  promptTokens?: number;
  completionTokens?: number;
  hasToolCall: boolean;
  rawSpan: Span;
}

export function useAISpansWithDescendants(): Span[] {
  const { allTraces } = useSentryTraces();

  const aiSpansWithDescendants = useMemo(() => {
    const resultSpans: Span[] = [];
    const addedSpanIds = new Set<SpanId>();

    const collectDescendants = (span: Span) => {
      if (!addedSpanIds.has(span.span_id)) {
        resultSpans.push(span);
        addedSpanIds.add(span.span_id);
      }
      if (span.children) {
        for (const child of span.children) {
          collectDescendants(child);
        }
      }
    };

    const findAndCollectRecursive = (spansToSearch: Span[]) => {
      for (const currentSpan of spansToSearch) {
        if (currentSpan.description?.toLowerCase().startsWith(AI_SPAN_DESCRIPTION_PREFIX)) {
          // if it matches, add it and all its descendants
          collectDescendants(currentSpan);
        } else if (currentSpan.children && currentSpan.children.length > 0) {
          // if it doesn't match, continue searching in its children
          findAndCollectRecursive(currentSpan.children);
        }
      }
    };

    for (const trace of allTraces) {
      const spanTree = trace.spanTree;
      if (spanTree) {
        findAndCollectRecursive(spanTree);
      }
    }
    return resultSpans;
  }, [allTraces]);

  return aiSpansWithDescendants;
}

export function useAITraces(): Span[] {
  const { allTraces } = useSentryTraces();

  const aiTraceRoots = useMemo(() => {
    const resultRoots: Span[] = [];

    const findAndCollectAIRoots = (spansToSearch: Span[]) => {
      for (const currentSpan of spansToSearch) {
        if (currentSpan.description?.toLowerCase().startsWith(AI_SPAN_DESCRIPTION_PREFIX)) {
          // root ai span, add it
          resultRoots.push(currentSpan);
          // don't get into its children as we found the root. children are part of this ai trace
        } else {
          // not an ai span, its children might be ai spans
          if (currentSpan.children && currentSpan.children.length > 0) {
            findAndCollectAIRoots(currentSpan.children);
          }
        }
      }
    };

    for (const trace of allTraces) {
      const spanTree = trace.spanTree;
      if (spanTree) {
        findAndCollectAIRoots(spanTree);
      }
    }
    return resultRoots;
  }, [allTraces]);

  return aiTraceRoots;
}

export function useProcessedAITraces(): ProcessedAITrace[] {
  const aiRootSpans = useAITraces();

  const processedTraces = useMemo(() => {
    return aiRootSpans.map((rootSpan): ProcessedAITrace => {
      let promptTokens: number | undefined;
      let completionTokens: number | undefined;
      let determinedOperation = 'N/A';
      let foundToolCallAsOperationId = false;
      let foundGenericToolCall = false;
      let traceName = rootSpan.description || rootSpan.op || 'AI Interaction';

      // Traverse all descendants including the rootSpan itself
      const allSpansInTree: Span[] = [];
      const queue: Span[] = [rootSpan];
      const visited = new Set<SpanId>();

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current.span_id)) {
          continue;
        }
        visited.add(current.span_id);
        allSpansInTree.push(current);
        if (current.children) {
          for (const child of current.children) {
            queue.push(child);
          }
        }
      }

      for (const s of allSpansInTree) {
        if (s.data) {
          if (promptTokens === undefined && s.data['ai.usage.promptTokens'] !== undefined) {
            promptTokens = Number(s.data['ai.usage.promptTokens']);
          }
          if (completionTokens === undefined && s.data['ai.usage.completionTokens'] !== undefined) {
            completionTokens = Number(s.data['ai.usage.completionTokens']);
          }
          if (promptTokens === undefined && s.data['gen_ai.usage.input_tokens'] !== undefined) {
            promptTokens = Number(s.data['gen_ai.usage.input_tokens']);
          }
          if (completionTokens === undefined && s.data['gen_ai.usage.output_tokens'] !== undefined) {
            completionTokens = Number(s.data['gen_ai.usage.output_tokens']);
          }

          // get operation
          const currentSpanOperationId = s.data['ai.operationId'] as string;
          if (currentSpanOperationId === 'ai.toolCall') {
            determinedOperation = 'ai.toolCall';
            foundToolCallAsOperationId = true;
            foundGenericToolCall = true; // Also implies a generic tool call was found
            // if we find ai.toolCall as operationId, this is the most specific operation we want to show

            // set the trace name to the tool call name if available
            if (s.data['ai.toolCall.name']) {
              traceName = String(s.data['ai.toolCall.name']);
              //TODO: determine what we want to do when there's more than just 1 tool call in the same trace
              // we are showing the name of the first one only
            }
          }

          // if ai.toolCall wasn't the operationId, but another operationId exists, take the first one encountered
          if (!foundToolCallAsOperationId && currentSpanOperationId && determinedOperation === 'N/A') {
            // check if the span is root or direct child for higher priority for non-toolcall op IDs
            if (s.span_id === rootSpan.span_id || rootSpan.children?.some(child => child.span_id === s.span_id)) {
              determinedOperation = currentSpanOperationId;
            }
          }
        }
        // check for generic tool call by op field if not already confirmed by operationId
        if (s.op === 'ai.toolCall') {
          foundGenericToolCall = true;
        }
      }

      // fallback for operation if still N/A
      if (determinedOperation === 'N/A' && rootSpan.op) {
        determinedOperation = rootSpan.op;
      }
      if (determinedOperation === 'N/A' && rootSpan.description?.startsWith('ai.')) {
        determinedOperation = rootSpan.description;
      }

      const tokensDisplay =
        promptTokens !== undefined && completionTokens !== undefined
          ? `${promptTokens} / ${completionTokens}`
          : promptTokens !== undefined
            ? `${promptTokens} / ?`
            : completionTokens !== undefined
              ? `? / ${completionTokens}`
              : 'N/A';

      const durationMs = rootSpan.timestamp - rootSpan.start_timestamp;

      return {
        id: rootSpan.span_id,
        name: traceName,
        operation: determinedOperation,
        timestamp: rootSpan.start_timestamp,
        durationMs,
        tokensDisplay,
        promptTokens,
        completionTokens,
        hasToolCall: foundGenericToolCall,
        rawSpan: rootSpan,
      };
    });
  }, [aiRootSpans]);

  return processedTraces;
}
