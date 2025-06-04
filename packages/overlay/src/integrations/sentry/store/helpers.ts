import useSentryStore from ".";
import type { Span } from "../types";

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

export function getAllSpansInTree(root: Span): Span[] {
  const spans = [root];
  return root.children ? spans.concat(root.children.flatMap(getAllSpansInTree)) : spans;
}
