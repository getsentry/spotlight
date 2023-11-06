import type { ReactNode } from 'react';
import React, { useState } from 'react';
import type { Integration } from '~/integrations/integration';

// TODO: What do we do with this? It can't stay global as long as there's Sentry stuff in it
export const NavigationContext = React.createContext<{
  integrations: Integration[];
  setIntegrations: (integrations: Integration[]) => void;
  eventId: string | null;
  setEventId: (id: string | null) => void;
  traceId: string | null;
  setTraceId: (id: string | null) => void;
  spanId: string | null;
  setSpanId: (traceId: string | null, spanId?: string | null) => void;
}>({
  integrations: [],
  eventId: null,
  traceId: null,
  spanId: null,
  setIntegrations: function () {},
  setEventId: function () {},
  setTraceId: function () {},
  setSpanId: function () {},
});

export const NavigationProvider: React.FC<{
  children: ReactNode;
  initializedIntegrations: Integration[];
}> = ({ children, initializedIntegrations }) => {
  const [integrations, setIntegrations] = useState<Integration[]>(initializedIntegrations);
  const [eventId, setEventId] = useState<null | string>(null);
  const [traceId, setTraceId] = useState<null | string>(null);
  const [spanId, setSpanId] = useState<null | string>(null);

  return (
    <NavigationContext.Provider
      value={{
        integrations,
        setIntegrations: (integrations: Integration[]) => {
          setIntegrations(integrations);
          setEventId(null);
          setTraceId(null);
          setSpanId(null);
        },
        eventId,
        setEventId: (...args) => {
          setEventId(...args);
          setTraceId(null);
          setSpanId(null);
        },
        traceId,
        setTraceId: (...args) => {
          setTraceId(...args);
          setSpanId(null);
          setEventId(null);
        },
        spanId,
        setSpanId: (traceId: string | null, spanId?: string | null) => {
          setEventId(null);
          setTraceId(traceId);
          setSpanId(!traceId ? null : spanId || null);
        },
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
