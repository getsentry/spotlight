import React, { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_EXPERIMENTS, DEFAULT_SIDECAR_URL } from '../constants';
import { type SpotlightContext } from '../integrations/integration';

const Context = createContext<SpotlightContext>({
  open: () => {},
  close: () => {},
  experiments: DEFAULT_EXPERIMENTS,
  sidecarUrl: DEFAULT_SIDECAR_URL,
});

export const SpotlightContextProvider: React.FC<{
  children: ReactNode;
  context: SpotlightContext;
}> = ({ children, context }) => {
  return <Context.Provider value={context}>{children}</Context.Provider>;
};

export const useSpotlightContext = () => {
  return useContext(Context);
};
