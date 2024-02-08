import type { ReactNode } from 'react';
import React, { useEffect, useReducer } from 'react';
import { SentryEvent } from '../types';
import sentryDataCache from './sentryDataCache';

interface SetEventsAction {
  e: SentryEvent | SentryEvent[];
  action: string;
}

interface SentryEventsContextProps {
  events: SentryEvent[];
  setEvents: React.Dispatch<SetEventsAction>;
}

export const SentryEventsContext = React.createContext<SentryEventsContextProps>({
  events: [],
  setEvents: () => {},
});

function eventReducer(state: SentryEvent[], message: SetEventsAction): SentryEvent[] {
  if (message.action === 'RESET' && Array.isArray(message.e)) {
    return message.e;
  } else if (message.action === 'APPEND' && !Array.isArray(message.e)) {
    return [message.e, ...state];
  }

  return state;
}

export const SentryEventsContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [events, setEvents] = useReducer(eventReducer, sentryDataCache.getEvents());

  useEffect(() => {
    const unsubscribe = sentryDataCache.subscribe('event', (e: SentryEvent) => {
      setEvents({ action: 'APPEND', e });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const contextValue: SentryEventsContextProps = {
    events,
    setEvents,
  };

  return <SentryEventsContext.Provider value={contextValue}>{children}</SentryEventsContext.Provider>;
};
