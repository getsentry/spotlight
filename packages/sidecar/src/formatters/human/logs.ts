import type { Envelope, SerializedLog } from "@sentry/core";
import type { SentryLogEvent } from "~/parser/index.js";
import { categorizeSDK, formatLogLine } from "./utils.js";

/**
 * Format a single log entry with SDK categorization
 */
function formatSingleLog(log: SerializedLog, source: "browser" | "mobile" | "server"): string {
  const level = log.level || "log";
  const message = log.body || "";

  const attrs: string[] = [];
  if (log.attributes) {
    for (const [key, attr] of Object.entries(log.attributes)) {
      if (!key.startsWith("sentry.") && attr.value !== undefined && attr.value !== null) {
        attrs.push(`${key}=${attr.value}`);
      }
    }
  }

  const fullMessage = attrs.length > 0 ? `${message} (${attrs.join(", ")})` : message;

  return formatLogLine(log.timestamp, source, level, fullMessage);
}

/**
 * Format a log event with envelope headers for SDK categorization
 */
export function formatLog(payload: SentryLogEvent, envelope: Envelope): string[] {
  const source = categorizeSDK(envelope);
  return payload.items.map(log => formatSingleLog(log, source));
}
