import useSentryStore from './sentryStore';

export const useSentrySdks = () => {
  return useSentryStore(state => state.getSdks());
};
