import type { Envelope, EnvelopeItem } from "@sentry/core";
import { logger } from "~/logger.js";
import type { RawEventContext } from "./types.js";

export type ParsedEnvelope = {
  event: Envelope;
  rawEvent: RawEventContext;
};

/**
 * Implements parser for
 * @see https://develop.sentry.dev/sdk/envelopes/#serialization-format
 * @param rawEvent Envelope data
 * @returns parsed envelope
 */
export function processEnvelope(rawEvent: RawEventContext): ParsedEnvelope {
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
      logger.error(err);
    }

    items.push([itemHeader, itemPayload] as EnvelopeItem);
  }

  const envelope = [envelopeHeader, items] as Envelope;

  return {
    event: envelope,
    rawEvent: rawEvent,
  };
}

function getLineEnd(data: Uint8Array): number {
  let end = data.indexOf(0xa);
  if (end === -1) {
    end = data.length;
  }

  return end;
}

function parseJSONFromBuffer<T = unknown>(data: Uint8Array): T {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch (err) {
    logger.error(err);
    return {} as T;
  }
}
