import type { Envelope, EnvelopeItem } from "@sentry/core";

/**
 * A formatter function that takes a payload and returns an array of formatted strings
 */
export type FormatterFunction = (event: EnvelopeItem[1], envelope?: Envelope) => string[];

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
