import { useContext } from "react";
import dataCache from "./dataCache";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentrySdks = () => {
  useContext(SentryEventsContext);
  return dataCache.getSdks();
};
