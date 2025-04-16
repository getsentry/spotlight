import { useContext } from 'react';
import { SentryEventsContext } from './sentryEventsContext';
import useSentryStore from './sentryStore';

export const useSentrySdks = () => {
  useContext(SentryEventsContext);
  return useSentryStore(state => state.getSdks());
};
