import type { Envelope, EnvelopeItem, SerializedLog } from "@sentry/core";
import { type SentryEvent, type SentryLogEvent, isLogEvent } from "../../parser/index.ts";
import type { EventContainer } from "../../utils/index.ts";
import { formatTimestamp } from "../utils.ts";

export function formatLogEnvelope(container: EventContainer) {
  const parsedEnvelope = container.getParsedEnvelope();
  if (!parsedEnvelope) {
    return [];
  }

  const {
    envelope: [envelopeHeader, items],
  } = parsedEnvelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "log" && isLogEvent(payload as SentryEvent)) {
      formatted.push(...formatLog(payload, envelopeHeader));
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
export function formatLog(payload: EnvelopeItem[1], _envelopeHeader: Envelope[0]): string[] {
  const event = payload as SentryLogEvent;
  return event.items.map(formatSingleLog);
}
