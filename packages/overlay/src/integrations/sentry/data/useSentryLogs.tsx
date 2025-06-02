import { useContext } from 'react';
import useSentryStore from '../store';
import { isLocalTrace } from '../store/helpers';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryLogs = (traceId?: string) => {
  useContext(SentryEventsContext);
  const { logsById, logsByTraceId } = useSentryStore(state => ({
    logsById: state.logsById,
    logsByTraceId: state.logsByTraceId,
  }));

  const allLogs = Array.from(traceId ? (logsByTraceId.get(traceId) ?? []) : logsById.values());
  const localLogs = allLogs.filter(item => item.trace_id && isLocalTrace(item.trace_id));

  return {
    allLogs,
    localLogs,
  };
};

export const useSentryLog = (id: string) => {
  useContext(SentryEventsContext);
  const getLogById = useSentryStore(state => state.getLogById);

  return getLogById(id);
};
