import { useContext } from 'react';
import useSentryStore from '../store';
import { SentryEventsContext } from './sentryEventsContext';

export const useSentrySdks = () => {
  useContext(SentryEventsContext);
  return useSentryStore(state => state.getSdks());
};
