import type { Envelope, SerializedLog } from "@sentry/core";
import type { SentryLogEvent } from "~/parser/index.js";
import { buildLogData } from "../shared/data-builders.js";

function formatSingleLog(log: SerializedLog): string {
  return JSON.stringify(buildLogData(log));
}

export function formatLog(event: SentryLogEvent, _envelopeHeader: Envelope[0]): string[] {
  return event.items.map(formatSingleLog);
}
