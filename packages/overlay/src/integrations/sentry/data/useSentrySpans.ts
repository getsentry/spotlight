import { useContext } from 'react';
import { Span, Trace } from '../types';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';
import { useSentryHelpers } from './useSentryHelpers';

export const useSentrySpans = () => {
  useContext(SentryEventsContext);
  const helpers = useSentryHelpers();
  const allTraces = sentryDataCache.getTraces();
  const localTraces = allTraces.filter(t => helpers.isTraceLocalToSession(t.eventProjectIds));

  const allSpans: Span[] = allTraces.reduce((acc: Span[], trace: Trace) => [...acc, ...trace.spans], []);
  const localSpans: Span[] = localTraces.reduce((acc: Span[], trace: Trace) => [...acc, ...trace.spans], []);
  return [allSpans, localSpans];
};
