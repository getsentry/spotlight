import type { ReactNode } from "react";
import React, { useContext, useEffect, useReducer } from "react";
import { SentryEvent } from "../types";
import eventCache from "./eventCache";

const SentryEventsContext = React.createContext<SentryEvent[]>([]);

function eventReducer(state: SentryEvent[], message: SentryEvent) {
  return [message, ...state];
}

export const SentryContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [events, addEvents] = useReducer(eventReducer, eventCache.values());

  useEffect(() => {
    const unsubscribe = eventCache.subscribe((e) => {
      addEvents(e);
    });
    return () => {
      unsubscribe();
    };
  });

  return (
    <SentryEventsContext.Provider value={events}>
      {children}
    </SentryEventsContext.Provider>
  );
};

export const useSentryEvents = () => {
  return useContext(SentryEventsContext);
};
