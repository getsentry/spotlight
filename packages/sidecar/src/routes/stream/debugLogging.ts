import { isDebugEnabled, logger } from "~/logger.js";
import { type ParsedEnvelope, type SentryErrorEvent, isErrorEvent } from "~/parser/index.js";
import type { EventContainer } from "~/utils/index.js";

/**
 * Logs incoming event details when debug mode is enabled
 * Uses the container's parsed data if available
 */
export function logIncomingEvent(container: EventContainer): void {
  if (!isDebugEnabled()) return;

  const contentType = container.getContentType();

  if (contentType === "application/x-sentry-envelope") {
    const envelope = container.getParsedEnvelope();

    if (!envelope) {
      // Still log something useful even if parsing failed
      const data = container.getData();
      const size = data.length;
      // Only show first line of envelope header for safety (should be JSON metadata, not user data)
      const firstNewline = data.indexOf("\n");
      const headerPreview =
        firstNewline > 0 && firstNewline < 200
          ? data.toString("utf-8", 0, firstNewline).replace(/\n/g, "\\n")
          : "header not found";
      logger.debug(`→ envelope (parse error, ${size} bytes) | ${headerPreview}`);
      return;
    }

    // Build complete log message with all details
    let logMessage = `→ ${formatEnvelopeMetadata(envelope)}`;

    // Add error event details to the same log message
    for (const item of envelope.event[1]) {
      if (isErrorEvent(item[1])) {
        logMessage += `\n  └ ${formatErrorDetails(item[1])}`;
      }
    }

    // Single atomic log statement
    logger.debug(logMessage);
  } else {
    logger.debug(`→ ${contentType || "unknown"}`);
  }
}

/**
 * Logs outgoing event to client when debug mode is enabled
 * Uses the container's already-parsed data if available
 */
export function logOutgoingEvent(container: EventContainer, clientId: string): void {
  if (!isDebugEnabled()) return;

  // Use the container's event type string (which uses cached parsed data)
  const typeInfo = container.getEventTypesString();

  // If it's an envelope that failed to parse, add size info
  if (typeInfo === "envelope" && container.getContentType() === "application/x-sentry-envelope") {
    const size = container.getData().length;
    logger.debug(`← envelope (${size} bytes) to ${clientId}`);
  } else {
    logger.debug(`← ${typeInfo} to ${clientId}`);
  }
}

/**
 * Formats envelope metadata for logging
 */
function formatEnvelopeMetadata(envelope: ParsedEnvelope): string {
  const eventTypes = envelope.event[1].map(item => item[0].type).filter(Boolean);

  const typePrefix = eventTypes.length > 0 ? eventTypes.join("+") : "envelope";
  const sdk = envelope.event[0].sdk?.name || "unknown";
  const eventId = envelope.event[0].event_id;

  return `${typePrefix} | sdk: ${sdk}${eventId ? ` | id: ${eventId}` : ""}`;
}

/**
 * Formats error event details for logging
 */
function formatErrorDetails(payload: SentryErrorEvent): string {
  const platform = payload.platform || "unknown";
  const environment = payload.environment || "unknown";
  const level = "level" in payload ? payload.level : "error";

  const errorMsg = payload.exception?.values?.[0]?.value || String(payload.message) || "No error message";

  const errorType = payload.exception?.values?.[0]?.type || "Error";

  const truncatedMsg = errorMsg.substring(0, 80) + (errorMsg.length > 80 ? "..." : "");

  return `${level} [${platform}/${environment}] ${errorType}: ${truncatedMsg}`;
}
