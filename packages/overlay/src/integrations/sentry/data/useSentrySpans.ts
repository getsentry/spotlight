import type { Span, Trace } from "@spotlightjs/core/sentry";
import { useContext } from "react";
import useSentryStore from "../store";
import { getLocalTraces } from "../store/helpers";
import { SentryEventsContext } from "./sentryEventsContext";

export function useSentryTraces() {
  useContext(SentryEventsContext);
  const { getTraces } = useSentryStore();
  const allTraces = getTraces();
  const localTraces = getLocalTraces();

  return { allTraces, localTraces };
}

function spanReducer(acc: Span[], trace: Trace) {
  for (const span of trace.spans.values()) {
    acc.push(span);
  }
  return acc;
}

function spanCountReducer(sum: number, trace: Trace) {
  return sum + trace.spans.size;
}

export const useSentrySpans = () => {
  const { allTraces, localTraces } = useSentryTraces();
  const allSpans: Span[] = allTraces.reduce(spanReducer, []);
  const localSpans: Span[] = localTraces.reduce(spanReducer, []);
  return { allSpans, localSpans };
};

export const useSentrySpanCounts = () => {
  const { allTraces, localTraces } = useSentryTraces();

  return {
    allSpans: allTraces.reduce(spanCountReducer, 0),
    localSpans: localTraces.reduce(spanCountReducer, 0),
  };
};
