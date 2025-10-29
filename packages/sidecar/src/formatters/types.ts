import type { Envelope, EnvelopeItem } from "@sentry/core";
import type { SentryErrorEvent, SentryEvent, SentryLogEvent, SentryTransactionEvent } from "~/parser/types.js";

/**
 * Strongly-typed formatter functions (no type guards needed in implementation)
 */
export type ErrorFormatterFn = (event: SentryErrorEvent, envelopeHeader: Envelope[0]) => string[];
export type LogFormatterFn = (event: SentryLogEvent, envelopeHeader: Envelope[0]) => string[];
export type TraceFormatterFn = (event: SentryTransactionEvent, envelopeHeader: Envelope[0]) => string[];

/**
 * Registry entry that bundles the formatter with its type guard
 */
export type FormatterEntry<T extends SentryEvent> = {
  typeGuard: (event: SentryEvent) => event is T;
  format: (event: T, envelopeHeader: Envelope[0]) => string[];
};

/**
 * The formatter registry structure - this IS the formatters object
 */
export type FormatterRegistry = {
  event: FormatterEntry<SentryErrorEvent>;
  log: FormatterEntry<SentryLogEvent>;
  transaction: FormatterEntry<SentryTransactionEvent>;
};

/**
 * Generic function to get a formatter from registry and apply it
 */
export function applyFormatter<K extends keyof FormatterRegistry>(
  registry: FormatterRegistry,
  eventType: K,
  payload: EnvelopeItem[1],
  envelopeHeader: Envelope[0],
): string[] {
  const entry = registry[eventType];
  const event = payload as SentryEvent;
  if (!entry.typeGuard(event)) {
    throw new Error(`Formatter received invalid event type: ${(event as any).type}`);
  }
  // Type assertion needed because TypeScript can't narrow the union type properly
  return entry.format(event as any, envelopeHeader);
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
