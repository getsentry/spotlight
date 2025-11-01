import { useContext } from "react";
import useSentryStore from "../store";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentryEvents = (traceId?: string) => {
  useContext(SentryEventsContext);
  const events = traceId
    ? useSentryStore(state => state.getEventsByTrace)(traceId)
    : useSentryStore(state => state.getEvents)();

  return events.sort((a, b) => b.timestamp - a.timestamp);
};
