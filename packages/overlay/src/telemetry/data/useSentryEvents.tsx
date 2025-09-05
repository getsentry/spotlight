import { useContext } from "react";
import useSentryStore from "../store";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentryEvents = (traceId?: string) => {
  useContext(SentryEventsContext);
  const getEvents = useSentryStore(state => state.getEvents);
  const getEventsByTrace = useSentryStore(state => state.getEventsByTrace);

  return traceId ? getEventsByTrace(traceId) : getEvents();
};
