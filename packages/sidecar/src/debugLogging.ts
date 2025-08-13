import { formatEnvelopeMetadata, formatErrorDetails } from "./envelopeParser.js";
import type { EventContainer } from "./eventContainer.js";
import { isDebugEnabled, logger } from "./logger.js";

/**
 * Logs incoming event details when debug mode is enabled
 * Uses the container's parsed data if available
 */
export function logIncomingEvent(container: EventContainer): void {
  if (!isDebugEnabled()) return;

  const contentType = container.getContentType();
  const envelope = container.getParsedEnvelope();

  if (contentType === "application/x-sentry-envelope") {
    if (!envelope) {
      logger.debug("→ envelope (parse error)");
      return;
    }

    // Build complete log message with all details
    let logMessage = `→ ${formatEnvelopeMetadata(envelope)}`;

    // Add error event details to the same log message
    for (const item of envelope.items) {
      if (item.header.type === "event" && item.payload) {
        logMessage += `\n  └ ${formatErrorDetails(item.payload)}`;
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
  logger.debug(`← ${typeInfo} to ${clientId}`);
}
