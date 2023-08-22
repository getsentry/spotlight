import { useContext } from "react";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentryEvents = () => {
  return useContext(SentryEventsContext);
};
