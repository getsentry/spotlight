import type { Envelope, EnvelopeItem } from "@sentry/core";
import logfmt from "logfmt";
import { type SentryEvent, isErrorEvent } from "~/parser/index.js";
import { buildErrorData } from "../shared/data-builders.js";

export function formatError(payload: EnvelopeItem[1], _envelopeHeader: Envelope[0]): string[] {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Logfmt error formatter received invalid payload: expected object, got ${typeof payload}`);
  }

  const event = payload as SentryEvent;
  if (!isErrorEvent(event)) {
    throw new Error(
      `Logfmt error formatter received non-error event: type=${(event as any).type}, has exception=${!!(event as any).exception}`,
    );
  }

  return [logfmt.stringify(buildErrorData(event))];
}
