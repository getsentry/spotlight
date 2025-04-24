import { useContext } from 'react';
import { SentryEventsContext } from './sentryEventsContext';
import useSentryStore from './sentryStore';

export const useSentryEvents = (traceId?: string) => {
  useContext(SentryEventsContext);
  const getEvents = useSentryStore(state => state.getEvents);
  const getEventsByTrace = useSentryStore(state => state.getEventsByTrace);

  return traceId ? getEventsByTrace(traceId) : getEvents();
};
