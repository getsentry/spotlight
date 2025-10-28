import type { Envelope, EnvelopeItem, SerializedLog } from "@sentry/core";
import { type SentryEvent, isLogEvent } from "~/parser/index.js";
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
export function formatLog(payload: EnvelopeItem[1], envelope?: Envelope): string[] {
  if (!envelope) {
    throw new Error("Human formatter requires envelope parameter");
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const event = payload as SentryEvent;
  if (!isLogEvent(event)) {
    return [];
  }

  const source = categorizeSDK(envelope);
  return event.items.map(log => formatSingleLog(log, source));
}
