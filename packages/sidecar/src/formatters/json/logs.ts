import type { SerializedLog } from "@sentry/core";
import type { SentryLogEvent } from "~/parser/index.js";
import { buildLogData } from "../shared/data-builders.js";

function formatSingleLog(log: SerializedLog): string {
  return JSON.stringify(buildLogData(log));
}

export function formatLog(payload: SentryLogEvent): string[] {
  return payload.items.map(formatSingleLog);
}
