/**
 * Utilities for parsing Sentry envelopes for debug logging
 */

export interface EnvelopeHeader {
  event_id?: string;
  sdk?: {
    name: string;
    version?: string;
  };
}

export interface ItemHeader {
  type?: string;
  length?: number;
}

export interface EventPayload {
  platform?: string;
  environment?: string;
  level?: string;
  message?: string;
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
    }>;
  };
}

export interface ParsedEnvelope {
  header: EnvelopeHeader;
  items: Array<{
    header: ItemHeader;
    payload?: EventPayload;
  }>;
}

/**
 * Parses envelope lines into structured data
 */
export function parseEnvelope(body: Buffer): ParsedEnvelope | null {
  try {
    const lines = body.toString("utf-8").split("\n");
    if (lines.length < 1) return null;

    const header = JSON.parse(lines[0]) as EnvelopeHeader;
    const items: ParsedEnvelope["items"] = [];

    // Parse item headers and payloads (skip envelope header at index 0)
    for (let i = 1; i < lines.length; i += 2) {
      if (!lines[i]) continue;

      try {
        const itemHeader = JSON.parse(lines[i]) as ItemHeader;
        let payload: EventPayload | undefined;

        // Try to parse the payload if it's an event
        if (itemHeader.type === "event" && lines[i + 1]) {
          try {
            payload = JSON.parse(lines[i + 1]) as EventPayload;
          } catch {
            // Payload parsing failed, continue without it
          }
        }

        items.push({ header: itemHeader, payload });
      } catch {
        // Skip malformed items
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
