import type { ErrorEvent } from "@sentry/core";
import {
  type ParsedEnvelope,
  type SentryEvent,
  type SentryLogEvent,
  type SentryTransactionEvent,
  isErrorEvent,
  isLogEvent,
  isTraceEvent,
} from "../parser/index.js";
import { processErrorEvent } from "./errors.js";
import { formatEventOutput } from "./event.js";
import { processLogEvent } from "./logs.js";
import { formatTransactionEvent } from "./traces.js";

export const eventHandlers = {
  error: (payload: ErrorEvent) => formatEventOutput(processErrorEvent(payload)),
  log: (payload: SentryLogEvent) => payload.items.map(processLogEvent),
  trace: (payload: SentryTransactionEvent) => formatTransactionEvent(payload),
};

export function formatEnvelope(envelope: ParsedEnvelope["envelope"]): string[] {
  const [, items] = envelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload as SentryEvent)) {
      formatted.push(eventHandlers.error(payload as ErrorEvent));
    } else if (type === "log" && isLogEvent(payload as SentryEvent)) {
      formatted.push(...eventHandlers.log(payload as SentryLogEvent));
    } else if (type === "transaction" && isTraceEvent(payload as SentryEvent)) {
      formatted.push(...eventHandlers.trace(payload as SentryTransactionEvent));
    }
  }

  return formatted;
}
