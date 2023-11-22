import { useContext } from 'react';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentrySdks = () => {
  useContext(SentryEventsContext);
  return sentryDataCache.getSdks();
};
