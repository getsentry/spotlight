import { useContext } from 'react';
import { SentryEventsContext } from './sentryEventsContext';
import useSentryStore from './sentryStore';

export const useSentryHelpers = () => {
  useContext(SentryEventsContext);
  const isTraceLocal = useSentryStore(state => state.isTraceLocal);

  return {
    isLocalToSession: (traceId: string) => {
      return isTraceLocal(traceId);
    },
  };
};
