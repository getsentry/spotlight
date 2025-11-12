import type { Envelope, EnvelopeItem } from "@sentry/core";
import { logger } from "../logger.ts";
import type { SentryEvent } from "../parser/types.ts";
import type { FormatterRegistry } from "./types.ts";

export * from "./types.ts";

export { formatters as mdFormatters } from "./md/index.ts";
export { formatters as logfmtFormatters } from "./logfmt/index.ts";
export { formatters as jsonFormatters } from "./json/index.ts";
export { formatters as humanFormatters } from "./human/index.ts";

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
