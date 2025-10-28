import type { EnvelopeItem } from "@sentry/core";
import logfmt from "logfmt";
import { type SentryEvent, isErrorEvent } from "~/parser/index.js";
import { buildErrorData } from "../shared/data-builders.js";

export function formatError(payload: EnvelopeItem[1]): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const event = payload as SentryEvent;
  if (!isErrorEvent(event)) {
    return [];
  }

  return [logfmt.stringify(buildErrorData(event))];
}
