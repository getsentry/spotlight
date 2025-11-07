import type { Envelope, SerializedLog } from "@sentry/core";
import type { SentryLogEvent } from "~/parser/index.js";
import { formatLogLine, inferEnvelopeSource } from "./utils.js";

/**
 * Format a single log entry with source inference
 */
function formatSingleLog(log: SerializedLog, source: "browser" | "mobile" | "server"): string {
  const level = log.level || "log";
  const message = log.body || "";

  const attrs: string[] = [];
  if (log.attributes) {
    for (const [key, attr] of Object.entries(log.attributes)) {
      if (!key.startsWith("sentry.") && attr.value !== undefined && attr.value !== null) {
        attrs.push(`[${key}=${attr.value}]`);
      }
    }
  }

  const fullMessage = attrs.length > 0 ? `${message} ${attrs.join(" ")}` : message;

  return formatLogLine(log.timestamp, source, level, fullMessage);
}

/**
 * Format a log event with envelope headers for source inference
 */
export function formatLog(event: SentryLogEvent, envelopeHeader: Envelope[0]): string[] {
  const source = inferEnvelopeSource(envelopeHeader, event);
  return event.items.map(log => formatSingleLog(log, source));
}
