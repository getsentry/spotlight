import type { EnvelopeItem, SerializedLog } from "@sentry/core";
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
export function formatLog(payload: EnvelopeItem[1], envelopeHeader: EnvelopeItem[0]): string[] {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Human log formatter received invalid payload: expected object, got ${typeof payload}`);
  }

  const event = payload as SentryEvent;
  if (!isLogEvent(event)) {
    throw new Error(`Human log formatter received non-log event: type=${(event as any).type}`);
  }

  const source = categorizeSDK(envelopeHeader);
  return event.items.map(log => formatSingleLog(log, source));
}
