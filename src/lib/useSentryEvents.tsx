import type { ReactNode } from "react";
import React, { useContext, useReducer } from "react";
import { useEventSource, useEventSourceListener } from "./useEventSource";
import { SentryEvent } from "../types";

const SentryEventsContext = React.createContext<SentryEvent[]>([]);

function eventReducer(state: SentryEvent[], message: SentryEvent) {
  return [message, ...state];
}

export const SentryContextProvider: React.FC<{
  initialValue?: SentryEvent[];
  children: ReactNode;
}> = ({ initialValue = [], children }) => {
  const [events, addEvents] = useReducer(eventReducer, initialValue);
  const [eventSource] = useEventSource("http://localhost:8969/stream");

  useEventSourceListener(
    eventSource,
    ["message"],
    (evt) => {
      addEvents(JSON.parse(evt.data));
    },
    [addEvents]
  );

  return (
    <SentryEventsContext.Provider value={events}>
      {children}
    </SentryEventsContext.Provider>
  );
};

export const useSentryEvents = () => {
  return useContext(SentryEventsContext);
};
