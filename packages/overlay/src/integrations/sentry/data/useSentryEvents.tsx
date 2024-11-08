import { useContext } from 'react';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryEvents = (traceId?: string) => {
  useContext(SentryEventsContext);
  return traceId ? sentryDataCache.getEventsByTrace(traceId) : sentryDataCache.getEvents();
};
