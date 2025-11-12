import type { Envelope } from "@sentry/core";
import logfmt from "logfmt";
import type { SentryErrorEvent } from "../../parser/index.ts";
import { buildErrorData } from "../shared/data-builders.ts";

export function formatError(event: SentryErrorEvent, _envelopeHeader: Envelope[0]): string[] {
  return [logfmt.stringify(buildErrorData(event))];
}
