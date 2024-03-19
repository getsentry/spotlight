import { useContext } from 'react';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';
import { useSentryHelpers } from './useSentryHelpers';

export const useSentryEnvelopes = () => {
  useContext(SentryEventsContext);
  const helpers = useSentryHelpers();
  const allEnvelopes = sentryDataCache.getEnvelopes();

  const localEnvelopes = allEnvelopes.filter(({ envelope }) => {
    const { trace_id } = (envelope[0]?.trace as { trace_id?: string }) || {};
    if (trace_id) return helpers.isLocalToSession(trace_id) !== false;
    return false;
  });
  return [allEnvelopes, localEnvelopes];
};
