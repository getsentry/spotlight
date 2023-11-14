import { useContext } from 'react';
import sentryDataCache from '~/integrations/sentry/data/sentryDataCache';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentrySdks = () => {
  useContext(SentryEventsContext);
  return sentryDataCache.getSdks();
};
