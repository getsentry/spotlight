import type { Envelope, EnvelopeItem } from "@sentry/core";
import { logger } from "@spotlight/server/logger.js";
import type { SentryEvent } from "@spotlight/server/parser/types.js";
import type { FormatterRegistry } from "./types.js";

export * from "./types.js";

export { formatters as mdFormatters } from "./md/index.js";
export { formatters as logfmtFormatters } from "./logfmt/index.js";
export { formatters as jsonFormatters } from "./json/index.js";
export { formatters as humanFormatters } from "./human/index.js";

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
    logger.warn(`Skipping event: type guard failed for ${eventType} (event.type=${(event as any).type})`);
    return [];
  }
  // Type assertion needed because TypeScript can't narrow the union type properly
  return entry.format(event as any, envelopeHeader);
}
