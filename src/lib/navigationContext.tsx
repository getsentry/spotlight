import type { ReactNode } from "react";
import React, { useState } from "react";

export const NavigationContext = React.createContext<{
  eventId: string | null;
  setEventId: (id: string | null) => void;
  traceId: string | null;
  setTraceId: (id: string | null) => void;
  spanId: string | null;
  setSpanId: (traceId: string | null, spanId?: string | null) => void;
}>({
  eventId: null,
  traceId: null,
  spanId: null,
  setEventId: function () {},
  setTraceId: function () {},
  setSpanId: function () {},
});

export const NavigationProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [eventId, setEventId] = useState<null | string>(null);
  const [traceId, setTraceId] = useState<null | string>(null);
  const [spanId, setSpanId] = useState<null | string>(null);

  return (
    <NavigationContext.Provider
      value={{
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
