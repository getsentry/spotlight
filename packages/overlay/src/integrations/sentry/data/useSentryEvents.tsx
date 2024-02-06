import { useContext } from 'react';
import sentryDataCache from './sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryEvents = () => {
  useContext(SentryEventsContext);
  return sentryDataCache.getEvents();
};
