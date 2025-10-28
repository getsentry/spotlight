import type { Envelope, ErrorEvent } from "@sentry/core";
import { categorizeSDK, formatLogLine } from "./utils.js";

/**
 * Format an error event with envelope headers for SDK categorization
 */
export function formatError(payload: unknown, envelope?: Envelope): string[] {
  if (!envelope) {
    throw new Error("Human formatter requires envelope parameter");
  }
  const event = payload as ErrorEvent;
  const source = categorizeSDK(envelope);

  const exception = event.exception?.values?.[0];
  const errorType = exception?.type || "Error";
  const errorValue = exception?.value || event.message || event.logentry?.message || "Unknown error";

  let message = `${errorType}: ${errorValue}`;

  const frames = exception?.stacktrace?.frames;
  if (frames?.length) {
    const frame = frames.find((f: any) => f.in_app) || frames[frames.length - 1];
    if (frame) {
      if (frame.filename && frame.lineno) {
        const location = frame.colno
          ? `${frame.filename}:${frame.lineno}:${frame.colno}`
          : `${frame.filename}:${frame.lineno}`;
        message += ` at ${location}`;
      } else if (frame.filename) {
        message += ` in ${frame.filename}`;
      }

      if (frame.function && !message.includes(frame.function)) {
        message += ` (${frame.function})`;
      }
    }
  }

  return [formatLogLine(event.timestamp, source, "error", message)];
}
