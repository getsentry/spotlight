import type { ErrorEvent, SerializedLog } from "@sentry/core";
import type { ParsedEnvelope, SentryTransactionEvent } from "../parser/index.js";

/**
 * Interface that all formatters must implement.
 * Each formatter provides methods to format different types of Sentry events.
 */
export interface Formatter {
  /**
   * Format an error event
   */
  formatError(payload: ErrorEvent): string;

  /**
   * Format a log event
   */
  formatLog(log: SerializedLog): string;

  /**
   * Format a trace/transaction event
   */
  formatTrace(payload: SentryTransactionEvent): string;

  /**
   * Format an entire envelope containing multiple events.
   * Returns a single string ready to be displayed/printed.
   */
  formatEnvelope(envelope: ParsedEnvelope["envelope"]): string;
}

/**
 * Available formatter types.
 * Add new formatters here as they are implemented.
 */
export type FormatterType = "md" | "logfmt" | "json";

/**
 * Runtime array of valid formatter types for validation.
 * Keep in sync with FormatterType.
 */
export const AVAILABLE_FORMATTERS: readonly FormatterType[] = ["md", "logfmt", "json"] as const;
