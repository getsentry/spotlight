import { useContext } from "react";
import useSentryStore from "../store";
import { SentryEventsContext } from "./sentryEventsContext";

export const useSentryLogs = (traceId?: string) => {
  useContext(SentryEventsContext);
  const { getLogs, getLogsByTraceId } = useSentryStore();

  return Array.from(traceId ? getLogsByTraceId(traceId) : getLogs()).sort((a, b) => b.timestamp - a.timestamp);
};

export const useSentryLog = (id: string) => {
  useContext(SentryEventsContext);
  const getLogById = useSentryStore(state => state.getLogById);

  return getLogById(id);
};
