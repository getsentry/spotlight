import logfmt from "logfmt";
import type { SentryTransactionEvent } from "~/parser/index.js";
import { buildTraceData } from "../shared/data-builders.js";

export function formatTrace(event: unknown): string[] {
  return [logfmt.stringify(buildTraceData(event as SentryTransactionEvent))];
}
