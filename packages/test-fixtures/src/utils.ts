import type { ErrorEvent } from "@sentry/core";

export type Payload = [string, Uint8Array];

/**
 * Helper to create a properly formatted envelope payload for testing
 */
export function createEnvelopePayload(event: ErrorEvent): Payload {
  // Sentry envelope format: header line, then items
  const header = JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() });
  const itemHeader = JSON.stringify({ type: "event" });
  const itemPayload = JSON.stringify(event);
  
  // Format: header\nitem_header\nitem_payload
  const envelopeString = `${header}\n${itemHeader}\n${itemPayload}`;
  const encoder = new TextEncoder();
  return ["application/x-sentry-envelope", encoder.encode(envelopeString)];
}

/**
 * Helper to format an error event as SSE data for the /stream endpoint
 */
export function formatAsSSE(payload: Payload): string {
  const [contentType, data] = payload;
  const base64Data = Buffer.from(data).toString('base64');
  return `data: ${JSON.stringify({ contentType, data: base64Data })}\n\n`;
}