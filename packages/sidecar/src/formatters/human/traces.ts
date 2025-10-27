import type { Envelope } from "@sentry/core";
import type { SentryTransactionEvent } from "~/parser/index.js";
import { getDuration } from "../utils.js";
import { categorizeSDK, formatLogLine } from "./utils.js";

/**
 * Format a trace/transaction event with envelope headers for SDK categorization
 */
export function formatTrace(payload: SentryTransactionEvent, envelope: Envelope): string[] {
  const source = categorizeSDK(envelope);

  const transaction = payload.transaction;
  const trace = payload.contexts?.trace;

  let message = transaction || trace?.description || "Transaction";

  const op = trace?.op;
  if (op && op !== "default" && op !== "unknown") {
    message = `[${op}] ${message}`;
  }

  const duration = getDuration(payload.timestamp, payload.start_timestamp);
  if (duration !== undefined) {
    message += ` ${Math.round(duration)}ms`;
  }

  const status = trace?.status;
  if (status && status !== "ok") {
    message += ` (${status})`;
  }

  const spanCount = payload.spans?.length;
  if (spanCount && spanCount > 0) {
    message += ` [${spanCount} span${spanCount === 1 ? "" : "s"}]`;
  }

  return [formatLogLine(payload.timestamp, source, "trace", message)];
}
