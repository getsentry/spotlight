import type { ReactNode } from 'react';
import React, { useEffect, useReducer } from 'react';
import sentryDataCache from './sentryDataCache';
import { SentryEvent } from '../types';

export const SentryEventsContext = React.createContext<SentryEvent[]>([]);

function eventReducer(state: SentryEvent[], message: SentryEvent) {
  return [message, ...state];
}

export const SentryEventsContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [events, addEvents] = useReducer(eventReducer, sentryDataCache.getEvents());

  useEffect(() => {
    const unsubscribe = sentryDataCache.subscribe('event', (e: SentryEvent) => {
      addEvents(e);
    });
    return () => {
      unsubscribe();
    };
  });

  return <SentryEventsContext.Provider value={events}>{children}</SentryEventsContext.Provider>;
};
