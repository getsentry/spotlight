import type { Envelope } from "@sentry/core";
import logfmt from "logfmt";
import type { SentryTransactionEvent } from "../../parser/index.ts";
import { buildTraceData } from "../shared/data-builders.ts";

export function formatTrace(event: SentryTransactionEvent, _envelopeHeader: Envelope[0]): string[] {
  return [logfmt.stringify(buildTraceData(event))];
}
