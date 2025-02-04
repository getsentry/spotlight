import { useContext } from 'react';
import type { Span, Trace } from '../types';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';
import { useSentryHelpers } from './useSentryHelpers';

export function useSentryTraces() {
  useContext(SentryEventsContext);
  const helpers = useSentryHelpers();
  const allTraces = sentryDataCache.getTraces();
  const localTraces = allTraces.filter(t => helpers.isLocalToSession(t.trace_id) !== false);

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
