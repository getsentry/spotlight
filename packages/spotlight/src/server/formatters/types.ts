import type { Envelope } from "@sentry/core";
import type {
  SentryErrorEvent,
  SentryEvent,
  SentryLogEvent,
  SentryMetricEvent,
  SentryTransactionEvent,
} from "../parser/types.ts";

/**
 * Strongly-typed formatter functions (no type guards needed in implementation)
 */
export type ErrorFormatterFn = (event: SentryErrorEvent, envelopeHeader: Envelope[0]) => string[];
export type LogFormatterFn = (event: SentryLogEvent, envelopeHeader: Envelope[0]) => string[];
export type MetricFormatterFn = (event: SentryMetricEvent, envelopeHeader: Envelope[0]) => string[];
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
  metric: FormatterEntry<SentryMetricEvent>;
  transaction: FormatterEntry<SentryTransactionEvent>;
};

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
