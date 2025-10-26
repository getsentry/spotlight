import type { ErrorEvent, SerializedLog } from "@sentry/core";
import type { SentryTransactionEvent } from "../parser/index.js";

/**
 * A formatter function that takes a payload and returns an array of formatted strings
 */
export type FormatterFunction = (payload: any) => string[];

/**
 * Interface that all formatters must implement.
 * Each formatter provides methods to format different types of Sentry events.
 */
export interface Formatter {
  /**
   * Format an error event
   */
  formatError(payload: ErrorEvent): string[];

  /**
   * Format a log event
   */
  formatLog(log: SerializedLog): string[];

  /**
   * Format a trace/transaction event
   */
  formatTrace(payload: SentryTransactionEvent): string[];

  /**
   * Map of event types to formatter functions.
   * Keys are event types from envelope items (e.g., "event", "transaction", "log")
   */
  formatters: Map<string, FormatterFunction>;
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
