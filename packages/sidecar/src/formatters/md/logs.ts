import type { SerializedLog } from "@sentry/core";
import { type SentryEvent, type SentryLogEvent, isLogEvent } from "../../parser/index.js";
import type { EventContainer } from "../../utils/index.js";
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
      for (const log of (payload as SentryLogEvent).items) {
        formatted.push(formatLog(log));
      }
    }
  }

  return formatted;
}

/**
 * Format a log event to markdown string
 */
export function formatLog(event: SerializedLog): string {
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
