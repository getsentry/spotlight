import { useMemo } from 'react';
import { useSentryTraces } from '~/integrations/sentry/data/useSentrySpans';
import type { Span, SpanId } from '~/integrations/sentry/types';

export default function useAiSpansWithDescendants(): Span[] {
  const { allTraces } = useSentryTraces();
  const AI_SPAN_DESCRIPTION_PREFIX = 'ai'; // all spans that start with this prefix are from the vercel ai sdk https://ai-sdk.dev/docs/ai-sdk-core/telemetry

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
