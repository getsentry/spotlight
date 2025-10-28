import type { EnvelopeItem } from "@sentry/core";
import { type SentryEvent, isTraceEvent } from "~/parser/index.js";
import { buildTraceData } from "../shared/data-builders.js";

export function formatTrace(payload: EnvelopeItem[1]): string[] {
  if (!payload || typeof payload !== "object") {
    throw new Error(`JSON trace formatter received invalid payload: expected object, got ${typeof payload}`);
  }

  const event = payload as SentryEvent;
  if (!isTraceEvent(event)) {
    throw new Error(`JSON trace formatter received non-transaction event: type=${(event as any).type}`);
  }

  return [JSON.stringify(buildTraceData(event))];
}
