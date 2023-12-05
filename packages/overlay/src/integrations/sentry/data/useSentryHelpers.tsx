import { useContext } from 'react';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryHelpers = () => {
  useContext(SentryEventsContext);

  return {
    isLocalToSession: (traceId: string) => {
      return sentryDataCache.isTraceLocal(traceId);
    },
  };
};
