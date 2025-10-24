import type { ErrorEvent } from "@sentry/core";
import {
  type ParsedEnvelope,
  type SentryEvent,
  type SentryLogEvent,
  type SentryTransactionEvent,
  isErrorEvent,
  isLogEvent,
  isTraceEvent,
} from "../../parser/index.js";
import { formatError } from "./errors.js";
import { formatLog } from "./logs.js";
import { formatTrace } from "./traces.js";

export function formatEnvelope(envelope: ParsedEnvelope["envelope"]): string {
  const [, items] = envelope;

  const formatted: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload as SentryEvent)) {
      formatted.push(formatError(payload as ErrorEvent));
    } else if (type === "log" && isLogEvent(payload as SentryEvent)) {
      const logs = (payload as SentryLogEvent).items.map(formatLog);
      formatted.push(...logs);
    } else if (type === "transaction" && isTraceEvent(payload as SentryEvent)) {
      formatted.push(formatTrace(payload as SentryTransactionEvent));
    }
  }

  return formatted.join("\n");
}
