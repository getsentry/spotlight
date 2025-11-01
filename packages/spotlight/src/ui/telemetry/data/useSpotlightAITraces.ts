import { useMemo } from "react";
import { aiLibraries } from "../components/insights/aiTraces/sdks/aiLibraries";
import type { Span, SpotlightAITrace } from "../types";
import { useSentryTraces } from "./useSentrySpans";

export function useAITraces(): Span[] {
  const allTraces = useSentryTraces();

  return useMemo(() => {
    const rootSpans: Span[] = [];

    for (const trace of allTraces) {
      if (!trace.spanTree) continue;

      for (const framework of aiLibraries) {
        const frameworkRoots = framework.extractRootSpans(trace.spanTree);
        rootSpans.push(...frameworkRoots);
      }
    }

    return rootSpans;
  }, [allTraces]);
}

function processSpanAsTrace(span: Span): SpotlightAITrace {
  if (!span?.span_id) {
    return {
      id: "error-invalid-span",
      name: "Invalid Span",
      operation: "error",
      timestamp: 0,
      durationMs: 0,
      tokensDisplay: "N/A",
      hasToolCall: false,
      rawSpan: {} as Span,
      metadata: {
        metadata: {},
      },
      toolCalls: [],
    };
  }

  for (const framework of aiLibraries) {
    if (framework.canHandleSpan(span)) {
      return framework.processTrace(span);
    }
  }

  return {
    id: span.span_id,
    name: span.description || span.op || "Unknown AI Interaction",
    operation: "unknown",
    timestamp: span.start_timestamp || 0,
    durationMs: (span.timestamp || 0) - (span.start_timestamp || 0),
    tokensDisplay: "N/A",
    hasToolCall: false,
    rawSpan: span,
    metadata: {
      metadata: {},
    },
    toolCalls: [],
  };
}

export function useSpotlightAITraces(): SpotlightAITrace[] {
  const aiRootSpans = useAITraces();

  return useMemo(() => {
    return aiRootSpans.map(processSpanAsTrace);
  }, [aiRootSpans]);
}
