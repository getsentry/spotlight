import { type ReactNode, createContext, useMemo } from "react";
import useSentryStore from "../store";
import type { SentryEvent } from "../types";

export const SentryEventsContext = createContext<{ events: SentryEvent[] }>({ events: [] });

/** Context mirrors committed SDK state so reset/retention release old event references. */
export function SentryEventsContextProvider({ children }: { children: ReactNode }) {
  const state = useSentryStore();
  const value = useMemo(() => ({ events: Array.from(state.eventsById.values()) }), [state]);
  return <SentryEventsContext.Provider value={value}>{children}</SentryEventsContext.Provider>;
}
