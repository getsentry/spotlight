import useSentryStore from ".";

export function isLocalTrace(traceId: string) {
  const localTraceIds = useSentryStore.getState().localTraceIds;

  if (localTraceIds.has(traceId)) return true;
  if (localTraceIds.size > 0) return false;
  return null;
}

export function getLocalTraces() {
  const getTraces = useSentryStore.getState().getTraces;

  return getTraces().filter(t => isLocalTrace(t.trace_id) !== false);
}
