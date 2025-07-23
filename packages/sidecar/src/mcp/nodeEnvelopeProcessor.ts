import { parseJSONFromBuffer } from '@spotlightjs/overlay/dist/integrations/sentry/utils/bufferParsers.js';
import type { 
  Envelope, 
  EnvelopeItem, 
  RawEventContext 
} from './nodeAdapter.js';
import { logger } from '../logger.js';

function getLineEnd(buffer: Uint8Array): number {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 10) { // '\n'
      return i;
    }
  }
  return buffer.length;
}

/**
 * Node.js compatible version of processEnvelope that doesn't auto-call store methods
 * Based on processEnvelope from @spotlightjs/overlay but without the store.pushEnvelope() call
 * @see https://develop.sentry.dev/sdk/envelopes/#serialization-format
 * @param rawEvent Envelope data
 * @returns parsed envelope without side effects
 */
export function processEnvelopeNodeJs(rawEvent: RawEventContext) {
  let buffer = typeof rawEvent.data === "string" ? Uint8Array.from(rawEvent.data, c => c.charCodeAt(0)) : rawEvent.data;

  function readLine(length?: number) {
    const cursor = length ?? getLineEnd(buffer);
    const line = buffer.subarray(0, cursor);
    buffer = buffer.subarray(cursor + 1);
    return line;
  }

  const envelopeHeader = parseJSONFromBuffer(readLine()) as Envelope[0];

  const items: EnvelopeItem[] = [];
  while (buffer.length) {
    const itemHeader = parseJSONFromBuffer(readLine()) as EnvelopeItem[0];
    const payloadLength = itemHeader.length;
    const itemPayloadRaw = readLine(payloadLength);

    let itemPayload: EnvelopeItem[1];
    try {
      itemPayload = parseJSONFromBuffer(itemPayloadRaw);
      // data sanitization
      if (itemHeader.type) {
        // @ts-expect-error ts(2339) -- We should really stop adding type to payloads
        itemPayload.type = itemHeader.type;
      }
    } catch (err) {
      itemPayload = itemPayloadRaw;
      logger.error('Failed to parse envelope item payload:', err);
    }

    items.push([itemHeader, itemPayload] as EnvelopeItem);
  }

  const envelope = [envelopeHeader, items] as Envelope;
  
  // ✅ NO STORE CALL - this is the key difference from the original processEnvelope
  // The caller will handle pushing to their own store

  return {
    event: envelope,
    rawEvent: rawEvent,
  };
}