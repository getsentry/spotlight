import type { Envelope, EnvelopeItem } from "@sentry/core";

/**
 * A formatter function that takes an envelope item payload and envelope header, returning an array of formatted strings.
 * The payload is typed as EnvelopeItem[1] which represents the actual payload data from an envelope item.
 * The envelopeHeader is typed as Envelope[0] which contains metadata like SDK info about the entire envelope.
 * Formatters should use type guards (e.g., isErrorEvent, isLogEvent) to narrow the payload type.
 */
export type FormatterFunction = (payload: EnvelopeItem[1], envelopeHeader: Envelope[0]) => string[];

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
