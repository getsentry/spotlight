import type { Envelope, EnvelopeItem } from "@sentry/core";
import { type SentryEvent, isTraceEvent } from "~/parser/index.js";
import { getDuration } from "../utils.js";
import { categorizeSDK, formatLogLine } from "./utils.js";

/**
 * Format a trace/transaction event with envelope headers for SDK categorization
 */
export function formatTrace(payload: EnvelopeItem[1], envelopeHeader: Envelope[0]): string[] {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Human trace formatter received invalid payload: expected object, got ${typeof payload}`);
  }

  const event = payload as SentryEvent;
  if (!isTraceEvent(event)) {
    throw new Error(`Human trace formatter received non-transaction event: type=${(event as any).type}`);
  }

  const source = categorizeSDK(envelopeHeader);

  const transaction = event.transaction;
  const trace = event.contexts?.trace;

  let message = transaction || trace?.description || "Transaction";

  const op = trace?.op;
  if (op && op !== "default" && op !== "unknown") {
    message = `[${op}] ${message}`;
  }

  const duration = getDuration(event.timestamp, event.start_timestamp);
  if (duration !== undefined) {
    message += ` ${Math.round(duration)}ms`;
  }

  const status = trace?.status;
  if (status && status !== "ok") {
    message += ` (${status})`;
  }

  const spanCount = event.spans?.length;
  if (spanCount && spanCount > 0) {
    message += ` [${spanCount} span${spanCount === 1 ? "" : "s"}]`;
  }

  return [formatLogLine(event.timestamp, source, "trace", message)];
}
