/**
 * Utilities for parsing Sentry envelopes for debug logging
 */

import type { EnvelopeHeader, EventPayload, ItemHeader } from "@spotlightjs/core/sentry";

export interface ParsedEnvelope {
  header: EnvelopeHeader;
  items: Array<{
    header: ItemHeader;
    payload?: EventPayload;
  }>;
}

/**
 * Parses envelope bytes into structured data
 * Properly handles length-based payloads according to Sentry envelope format
 */
export function parseEnvelope(body: Buffer): ParsedEnvelope | null {
  try {
    let offset = 0;
    const items: ParsedEnvelope["items"] = [];

    // Find and parse envelope header (first line)
    const headerEnd = body.indexOf("\n", offset);
    if (headerEnd === -1) return null;

    const header = JSON.parse(body.toString("utf-8", offset, headerEnd)) as EnvelopeHeader;
    offset = headerEnd + 1;

    // Parse items using length field
    while (offset < body.length) {
      // Find item header line
      const itemHeaderEnd = body.indexOf("\n", offset);
      if (itemHeaderEnd === -1) break;

      // Skip empty lines
      if (itemHeaderEnd === offset) {
        offset = itemHeaderEnd + 1;
        continue;
      }

      try {
        const itemHeader = JSON.parse(body.toString("utf-8", offset, itemHeaderEnd)) as ItemHeader;
        offset = itemHeaderEnd + 1;

        let payload: EventPayload | undefined;

        // Use length field to read exact payload bytes
        if (itemHeader.length !== undefined && itemHeader.length > 0) {
          // Validate length is reasonable (max 10MB for safety)
          if (itemHeader.length > 10 * 1024 * 1024) {
            break; // Unreasonably large payload, skip
          }
          const payloadEnd = offset + itemHeader.length;
          if (payloadEnd > body.length) break; // Invalid length

          // Try to parse JSON payload for event types
          if (itemHeader.type === "event") {
            try {
              const payloadStr = body.toString("utf-8", offset, payloadEnd);
              payload = JSON.parse(payloadStr) as EventPayload;
            } catch {
              // Payload parsing failed, continue without it
            }
          }

          offset = payloadEnd;
        }

        items.push({ header: itemHeader, payload });
      } catch {
        // Skip malformed items, try to find next newline
        const nextLine = body.indexOf("\n", offset);
        if (nextLine === -1) break;
        offset = nextLine + 1;
      }
    }

    return { header, items };
  } catch {
    return null;
  }
}

/**
 * Formats envelope metadata for logging
 */
export function formatEnvelopeMetadata(envelope: ParsedEnvelope): string {
  const eventTypes = envelope.items.map(item => item.header.type).filter(Boolean);

  const typePrefix = eventTypes.length > 0 ? eventTypes.join("+") : "envelope";
  const sdk = envelope.header.sdk?.name || "unknown";
  const eventId = envelope.header.event_id;

  return `${typePrefix} | sdk: ${sdk}${eventId ? ` | id: ${eventId}` : ""}`;
}

/**
 * Formats error event details for logging
 */
export function formatErrorDetails(payload: EventPayload): string {
  const platform = payload.platform || "unknown";
  const environment = payload.environment || "unknown";
  const level = payload.level || "error";

  const errorMsg = payload.exception?.values?.[0]?.value || payload.message || "No error message";

  const errorType = payload.exception?.values?.[0]?.type || "Error";

  const truncatedMsg = errorMsg.substring(0, 80) + (errorMsg.length > 80 ? "..." : "");

  return `${level} [${platform}/${environment}] ${errorType}: ${truncatedMsg}`;
}
