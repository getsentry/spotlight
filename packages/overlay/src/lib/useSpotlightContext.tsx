import React, { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_EXPERIMENTS } from '../constants';
import { type SpotlightContext } from '../integrations/integration';
import { generate_uuidv4 } from './uuid';

const Context = createContext<SpotlightContext>({
  open: () => {},
  close: () => {},
  experiments: DEFAULT_EXPERIMENTS,
  projectId: generate_uuidv4(),
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
