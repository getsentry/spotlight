import type { AILibraryHandler, Span, SpotlightAITrace, Trace } from "@spotlightjs/core/sentry";
import { vercelAISDKHandler } from "./vercelAISDK";

// Registry of supported AI libraries
const aiLibraries: AILibraryHandler[] = [vercelAISDKHandler];

export { aiLibraries };

export function detectAILibraryHandler(span: Span): AILibraryHandler | null {
  for (const handler of aiLibraries) {
    // careful if we support multiple libraries, we should improve this method so it doesn't return the first one
    if (handler.canHandleSpan(span)) {
      return handler;
    }
  }
  return null;
}

export function extractAllAIRootSpans(spans: Span[]): { span: Span; handler: AILibraryHandler }[] {
  const results: { span: Span; handler: AILibraryHandler }[] = [];

  for (const handler of aiLibraries) {
    const rootSpans = handler.extractRootSpans(spans);
    for (const rootSpan of rootSpans) {
      results.push({ span: rootSpan, handler });
    }
  }

  return results;
}

export function createAITraceFromSpan(span: Span): SpotlightAITrace | null {
  const handler = detectAILibraryHandler(span);
  if (!handler) {
    return null;
  }

  return handler.processTrace(span);
}

export function hasAISpans(trace: Trace): boolean {
  if (!trace.spanTree) {
    return false;
  }

  // TODO: We may want to cache/optimize this `extractAllAIRootSpans` helper
  const aiRootSpans = extractAllAIRootSpans(trace.spanTree);
  return aiRootSpans.length > 0;
}
