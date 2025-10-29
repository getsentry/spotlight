import type { Envelope } from "@sentry/core";
import type { SentryErrorEvent } from "~/parser/index.js";
import { buildErrorData } from "../shared/data-builders.js";

export function formatError(event: SentryErrorEvent, _envelopeHeader: Envelope[0]): string[] {
  return [JSON.stringify(buildErrorData(event))];
}
