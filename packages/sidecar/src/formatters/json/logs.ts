import type { SerializedLog } from "@sentry/core";
import { buildLogData } from "../shared/data-builders.js";

export function formatLog(log: SerializedLog): string {
  return JSON.stringify(buildLogData(log));
}
