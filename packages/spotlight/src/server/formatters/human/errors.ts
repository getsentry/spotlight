import type { Envelope } from "@sentry/core";
import type { SentryErrorEvent } from "../../parser/index.ts";
import { formatLogLine, inferEnvelopeSource } from "./utils.ts";

/**
 * Format an error event with envelope headers for source inference
 */
export function formatError(event: SentryErrorEvent, envelopeHeader: Envelope[0]): string[] {
  const source = inferEnvelopeSource(envelopeHeader, event);

  const exception = event.exception?.values?.[0];
  const errorType = exception?.type || "Error";
  const errorValue = exception?.value || event.message || "Unknown error";

  let message = `${errorType}: ${errorValue}`;

  const frames = exception?.stacktrace?.frames;
  if (frames?.length) {
    const frame = frames.find((f: any) => f.in_app) || frames[frames.length - 1];
    if (frame) {
      if (frame.filename && frame.lineno) {
        const location = frame.colno
          ? `${frame.filename}:${frame.lineno}:${frame.colno}`
          : `${frame.filename}:${frame.lineno}`;
        message += ` [${location}]`;
      } else if (frame.filename) {
        message += ` [${frame.filename}]`;
      }

      if (frame.function && !message.includes(frame.function)) {
        message += ` [${frame.function}]`;
      }
    }
  }

  return [formatLogLine(event.timestamp, source, "error", message)];
}
