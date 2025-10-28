import type { Envelope } from "@sentry/core";

/**
 * A formatter function that takes a payload and returns an array of formatted strings.
 * The payload type is unknown to allow different formatters to handle different payload types
 * (e.g., ErrorEvent, SentryLogEvent, SentryTransactionEvent).
 * The envelope parameter is optional since some formatters need it (e.g., human) and others don't.
 */
export type FormatterFunction = (event: unknown, envelope?: Envelope) => string[];

/**
 * Interface that all formatters must implement.
 * Formatters expose a map of event types to formatter functions.
 */
export interface Formatter {
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
export type FormatterType = "md" | "logfmt" | "json" | "human";

/**
 * Runtime array of valid formatter types for validation.
 * Keep in sync with FormatterType.
 */
export const AVAILABLE_FORMATTERS: readonly FormatterType[] = ["md", "logfmt", "json", "human"] as const;
