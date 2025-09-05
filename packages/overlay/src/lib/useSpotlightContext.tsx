import type React from "react";
import { type ReactNode, createContext, useContext } from "react";
import type { SpotlightContext } from "~/types";
import { DEFAULT_EXPERIMENTS, DEFAULT_SIDECAR_URL } from "../constants";

const Context = createContext<SpotlightContext>({
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
  const context = useContext(Context);
  const getSidecarUrl = (path = "") => {
    return new URL(path, context.sidecarUrl).href;
  };
  return { ...context, getSidecarUrl };
};
