import { useContext } from 'react';
import useSentryStore from '../store';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryHelpers = () => {
  useContext(SentryEventsContext);
  const isTraceLocal = useSentryStore(state => state.isTraceLocal);

  return {
    isLocalToSession: (traceId: string) => {
      return isTraceLocal(traceId);
    },
  };
};
