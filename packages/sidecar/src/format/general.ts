import type { ErrorEvent } from "@sentry/core";
import {
  isErrorEvent,
  isLogEvent,
  type SentryLogEvent,
  type ParsedEnvelope,
  type SentryEvent,
} from "~/parser/index.js";
import { processErrorEvent } from "./errors.js";
import { formatEventOutput } from "./event.js";
import { processLogEvent } from "./logs.js";

export const eventHandlers = {
  error: (payload: ErrorEvent) => formatEventOutput(processErrorEvent(payload)),
  log: (payload: SentryLogEvent) => {
    const content: string[] = [];
    for (const log of payload.items) {
      content.push(processLogEvent(log));
    }
    return content;
  },
};

export function formatEnvelope(event: ParsedEnvelope["event"]): string[] {
  const [, items] = event;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload as SentryEvent)) {
      formatted.push(eventHandlers.error(payload as ErrorEvent));
    } else if (type === "log" && isLogEvent(payload as SentryEvent)) {
      formatted.push(...eventHandlers.log(payload as SentryLogEvent));
    }
  }

  return formatted;
}
