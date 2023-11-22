import { useContext } from 'react';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryTraces = () => {
  useContext(SentryEventsContext);
  return sentryDataCache.getTraces();
};
