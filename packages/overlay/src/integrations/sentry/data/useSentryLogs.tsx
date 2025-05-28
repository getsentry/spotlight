import { useContext } from 'react';
import { LOG_EVENT_TYPES } from '../constants/sentry';
import useSentryStore from '../store';
import { isLocalTrace } from '../store/helpers';
import type { SentryLogEvent } from '../types';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryLogs = (traceId?: string) => {
  useContext(SentryEventsContext);
  const getEvents = useSentryStore(state => state.getEvents);

  const allEvents = getEvents();
  const allLogs = (allEvents.filter(e => e.type && LOG_EVENT_TYPES.has(e.type)) as SentryLogEvent[])
    .map(e => e.items)
    .flat();

  const filteredAllLogs = traceId ? allLogs.filter(item => item.trace_id === traceId) : allLogs;

  const localLogs = filteredAllLogs.filter(item => item.trace_id && isLocalTrace(item.trace_id));

  return {
    allLogs: filteredAllLogs,
    localLogs,
  };
};
