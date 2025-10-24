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
import human from "./human/index.js";
import logfmt from "./logfmt/index.js";
import type { Formatter, FormatterType } from "./types.js";

const FORMATTERS: Record<FormatterType, Formatter> = {
  human,
  logfmt,
  // TODO: add json formatter
  json: logfmt, // fallback until we have a json formatter
};

export function formatEnvelope(envelope: ParsedEnvelope["envelope"], format: FormatterType): string[] {
  const [, items] = envelope;
  const formatter = FORMATTERS[format];

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload as SentryEvent)) {
      formatted.push(formatter.formatError(payload as ErrorEvent));
    } else if (type === "log" && isLogEvent(payload as SentryEvent)) {
      const logs = (payload as SentryLogEvent).items.map(formatter.formatLog);
      formatted.push(...logs);
    } else if (type === "transaction" && isTraceEvent(payload as SentryEvent)) {
      formatted.push(formatter.formatTrace(payload as SentryTransactionEvent));
    }
  }

  return formatted;
}
