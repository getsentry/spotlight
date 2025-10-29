import type { Envelope } from "@sentry/core";
import logfmt from "logfmt";
import type { SentryErrorEvent } from "~/parser/index.js";
import { buildErrorData } from "../shared/data-builders.js";

export function formatError(event: SentryErrorEvent, _envelopeHeader: Envelope[0]): string[] {
  return [logfmt.stringify(buildErrorData(event))];
}
