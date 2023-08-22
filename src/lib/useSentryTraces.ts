import { useContext } from "react";
import dataCache from "./dataCache";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentryTraces = () => {
  useContext(SentryEventsContext);
  return dataCache.getTraces();
};
