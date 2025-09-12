import { useContext } from "react";
import useSentryStore from "../store";
import type { Span, Trace } from "../types";
import { SentryEventsContext } from "./sentryEventsContext";

export function useSentryTraces() {
  useContext(SentryEventsContext);
  const { getTraces } = useSentryStore();
  const allTraces = getTraces();

  return { allTraces };
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
  const { allTraces } = useSentryTraces();
  const allSpans: Span[] = allTraces.reduce(spanReducer, []);
  return { allSpans };
};

export const useSentrySpanCounts = () => {
  const { allTraces } = useSentryTraces();

  return {
    allSpans: allTraces.reduce(spanCountReducer, 0),
  };
};
