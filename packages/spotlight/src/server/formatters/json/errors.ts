import type { Envelope } from "@sentry/core";
import type { SentryErrorEvent } from "../../parser/index.ts";
import { buildErrorData } from "../shared/data-builders.ts";

export function formatError(event: SentryErrorEvent, _envelopeHeader: Envelope[0]): string[] {
  return [JSON.stringify(buildErrorData(event))];
}
