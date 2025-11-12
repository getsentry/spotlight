import type { Envelope } from "@sentry/core";
import type { SentryTransactionEvent } from "../../parser/index.ts";
import { getDuration } from "../utils.ts";
import { formatLogLine, inferEnvelopeSource } from "./utils.ts";

/**
 * Format a trace/transaction event with envelope headers for source inference
 */
export function formatTrace(event: SentryTransactionEvent, envelopeHeader: Envelope[0]): string[] {
  const source = inferEnvelopeSource(envelopeHeader, event);

  const transaction = event.transaction;
  const trace = event.contexts?.trace;

  let message = transaction || trace?.description || "Transaction";

  const op = trace?.op;
  if (op && op !== "default" && op !== "unknown") {
    message = `[${op}] ${message}`;
  }

  const duration = getDuration(event.timestamp, event.start_timestamp);
  if (duration !== undefined) {
    message += ` [${Math.round(duration)}ms]`;
  }

  const status = trace?.status;
  if (status && status !== "ok") {
    message += ` [${status}]`;
  }

  const spanCount = event.spans?.length;
  if (spanCount && spanCount > 0) {
    message += ` [${spanCount} span${spanCount === 1 ? "" : "s"}]`;
  }

  return [formatLogLine(event.timestamp, source, "trace", message)];
}
