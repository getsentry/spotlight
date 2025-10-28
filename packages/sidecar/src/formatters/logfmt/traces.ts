import type { Envelope, EnvelopeItem } from "@sentry/core";
import logfmt from "logfmt";
import { type SentryEvent, isTraceEvent } from "~/parser/index.js";
import { buildTraceData } from "../shared/data-builders.js";

export function formatTrace(payload: EnvelopeItem[1], _envelopeHeader: Envelope[0]): string[] {
  const event = payload as SentryEvent;
  if (!isTraceEvent(event)) {
    throw new Error(`Logfmt trace formatter received non-transaction event: type=${(event as any).type}`);
  }

  return [logfmt.stringify(buildTraceData(event))];
}
