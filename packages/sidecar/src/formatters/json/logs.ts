import type { EnvelopeItem, SerializedLog } from "@sentry/core";
import { type SentryEvent, isLogEvent } from "~/parser/index.js";
import { buildLogData } from "../shared/data-builders.js";

function formatSingleLog(log: SerializedLog): string {
  return JSON.stringify(buildLogData(log));
}

export function formatLog(payload: EnvelopeItem[1]): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const event = payload as SentryEvent;
  if (!isLogEvent(event)) {
    return [];
  }

  return event.items.map(formatSingleLog);
}
