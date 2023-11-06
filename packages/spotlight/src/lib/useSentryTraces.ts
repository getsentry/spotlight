import { useContext } from 'react';
import sentryDataCache from '~/integrations/sentry/data/sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentryTraces = () => {
  useContext(SentryEventsContext);
  return sentryDataCache.getTraces();
};
