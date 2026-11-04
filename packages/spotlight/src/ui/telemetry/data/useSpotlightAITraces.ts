import { useMemo } from "react";
import { getAIRootSpans, getAITraces } from "../../../telemetry/selectors/ai.ts";
import type { Span, SpotlightAITrace } from "../types";
import { useSentryTraces } from "./useSentrySpans";

export function useAITraces(): Span[] {
  const traces = useSentryTraces();
  return useMemo(() => getAIRootSpans(traces), [traces]);
}
export function useSpotlightAITraces(): SpotlightAITrace[] {
  const traces = useSentryTraces();
  return useMemo(() => getAITraces(traces), [traces]);
}
