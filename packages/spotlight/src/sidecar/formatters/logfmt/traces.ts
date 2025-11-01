import type { Envelope } from "@sentry/core";
import logfmt from "logfmt";
import type { SentryTransactionEvent } from "~/parser/index.js";
import { buildTraceData } from "../shared/data-builders.js";

export function formatTrace(event: SentryTransactionEvent, _envelopeHeader: Envelope[0]): string[] {
  return [logfmt.stringify(buildTraceData(event))];
}
