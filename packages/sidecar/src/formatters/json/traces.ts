import type { SentryTransactionEvent } from "~/parser/index.js";
import { buildTraceData } from "../shared/data-builders.js";

export function formatTrace(event: unknown): string[] {
  return [JSON.stringify(buildTraceData(event as SentryTransactionEvent))];
}
