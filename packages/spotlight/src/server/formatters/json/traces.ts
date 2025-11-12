import type { Envelope } from "@sentry/core";
import type { SentryTransactionEvent } from "@spotlight/server/parser/index.js";
import { buildTraceData } from "../shared/data-builders.js";

export function formatTrace(event: SentryTransactionEvent, _envelopeHeader: Envelope[0]): string[] {
  return [JSON.stringify(buildTraceData(event))];
}
