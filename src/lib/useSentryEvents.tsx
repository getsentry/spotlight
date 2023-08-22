import { useContext } from "react";
import { SentryEventsContext } from "./sentryContextProvider";

export const useSentryEvents = () => {
  return useContext(SentryEventsContext);
};
