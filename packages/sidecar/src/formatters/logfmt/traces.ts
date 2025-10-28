import type { EnvelopeItem } from "@sentry/core";
import logfmt from "logfmt";
import { type SentryEvent, isTraceEvent } from "~/parser/index.js";
import { buildTraceData } from "../shared/data-builders.js";

export function formatTrace(payload: EnvelopeItem[1]): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const event = payload as SentryEvent;
  if (!isTraceEvent(event)) {
    return [];
  }

  return [logfmt.stringify(buildTraceData(event))];
}
