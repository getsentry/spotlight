import type { ReactNode } from 'react';
import React, { useEffect, useReducer } from 'react';
import { SentryEvent } from '../types';
import dataCache from './dataCache';

export const SentryEventsContext = React.createContext<SentryEvent[]>([]);

function eventReducer(state: SentryEvent[], message: SentryEvent) {
  return [message, ...state];
}

export const SentryEventsContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [events, addEvents] = useReducer(eventReducer, dataCache.getEvents());

  useEffect(() => {
    const unsubscribe = dataCache.subscribe('event', (e: SentryEvent) => {
      addEvents(e);
    });
    return () => {
      unsubscribe();
    };
  });

  return <SentryEventsContext.Provider value={events}>{children}</SentryEventsContext.Provider>;
};
