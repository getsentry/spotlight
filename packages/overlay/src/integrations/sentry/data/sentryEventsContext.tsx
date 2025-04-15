import type { ReactNode } from 'react';
import React, { useEffect, useReducer } from 'react';
import type { SentryEvent } from '../types';
import useSentryStore from './sentryStore';

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
  if (Array.isArray(message.e)) {
    if (message.action === 'RESET') {
      return message.e;
    }
  } else {
    if (message.action === 'APPEND') {
      return [message.e, ...state];
    }
  }

  return state;
}

export const SentryEventsContextProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [events, setEvents] = useReducer(eventReducer, []);
  const getEvents = useSentryStore(state => state.getEvents);
  const subscribe = useSentryStore(state => state.subscribe);

  useEffect(() => {
    // Set initial events
    setEvents({ action: 'RESET', e: getEvents() });

    // Subscribe to new events
    return subscribe('event', (event: SentryEvent) => {
      setEvents({ action: 'APPEND', e: event });
    });
  }, [getEvents, subscribe]);

  const contextValue: SentryEventsContextProps = {
    events,
    setEvents,
  };

  return <SentryEventsContext.Provider value={contextValue}>{children}</SentryEventsContext.Provider>;
};
