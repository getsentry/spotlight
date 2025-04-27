import { useContext } from 'react';
import useSentryStore from '../store';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryHelpers = () => {
  useContext(SentryEventsContext);
  const { isTraceLocal, getTraces } = useSentryStore();
  const getLocalTraces = () => getTraces().filter(t => isTraceLocal(t.trace_id) !== false);

  return {
    getLocalTraces,
  };
};
