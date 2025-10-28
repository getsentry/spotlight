import type { Envelope, EnvelopeItem, SerializedLog } from "@sentry/core";
import { type SentryEvent, isLogEvent } from "~/parser/index.js";
import { buildLogData } from "../shared/data-builders.js";

function formatSingleLog(log: SerializedLog): string {
  return JSON.stringify(buildLogData(log));
}

export function formatLog(payload: EnvelopeItem[1], _envelopeHeader: Envelope[0]): string[] {
  const event = payload as SentryEvent;
  if (!isLogEvent(event)) {
    throw new Error(`JSON log formatter received non-log event: type=${(event as any).type}`);
  }

  return event.items.map(formatSingleLog);
}
