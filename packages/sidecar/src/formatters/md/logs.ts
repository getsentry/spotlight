import type { EnvelopeItem, SerializedLog } from "@sentry/core";
import { type SentryEvent, type SentryLogEvent, isLogEvent } from "~/parser/index.js";
import type { EventContainer } from "~/utils/index.js";
import { formatTimestamp } from "../utils.js";

export function formatLogEnvelope(container: EventContainer) {
  const parsedEnvelope = container.getParsedEnvelope();

  const {
    envelope: [, items],
  } = parsedEnvelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "log" && isLogEvent(payload as SentryEvent)) {
      formatted.push(...formatLog(payload as SentryLogEvent));
    }
  }

  return formatted;
}

/**
 * Format a single log entry to markdown string
 */
function formatSingleLog(event: SerializedLog): string {
  let attr = "";
  for (const [key, property] of Object.entries(event.attributes ?? {})) {
    if (key.startsWith("sentry.")) {
      continue;
    }

    attr += `${key}: ${property.value} (${property.type})\n`;
  }

  return `${formatTimestamp(event.timestamp)} ${event.level} ${event.body}
Attributes:
${attr}`;
}

/**
 * Format a log event to markdown string
 */
export function formatLog(payload: EnvelopeItem[1]): string[] {
  // Type guard: log events are identified by the 'log' type
  if (!payload || typeof payload !== "object") {
    throw new Error(`MD log formatter received invalid payload: expected object, got ${typeof payload}`);
  }

  const event = payload as SentryEvent;
  if (!isLogEvent(event)) {
    throw new Error(`MD log formatter received non-log event: type=${(event as any).type}`);
  }

  return event.items.map(formatSingleLog);
}
