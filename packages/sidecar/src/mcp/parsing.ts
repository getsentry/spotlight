// This file is a copy of utils from @spotlightjs/overlay to parse envelopes from Buffer
import type { Envelope, EnvelopeItem } from "@sentry/core";

type RawEventContext = {
  contentType: string;
  data: string | Uint8Array;
};

export function processEnvelope(rawEvent: RawEventContext) {
  const buffer =
    typeof rawEvent.data === "string" ? Uint8Array.from(rawEvent.data, c => c.charCodeAt(0)) : rawEvent.data;

  const envelopeHeader = parseJSONFromBuffer(readLine(buffer)) as Envelope[0];

  const items: EnvelopeItem[] = [];
  while (buffer.length) {
    const itemHeader = parseJSONFromBuffer(readLine(buffer)) as EnvelopeItem[0];
    const payloadLength = itemHeader.length;
    const itemPayloadRaw = readLine(buffer, payloadLength);

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
      console.error(err);
    }

    items.push([itemHeader, itemPayload] as EnvelopeItem);
  }

  const envelope = [envelopeHeader, items] as Envelope;

  return {
    envelope,
  };
}

function readLine(buffer: Uint8Array, length?: number) {
  const cursor = length ?? getLineEnd(buffer);
  const line = buffer.subarray(0, cursor);
  buffer = buffer.subarray(cursor + 1);
  return line;
}

function getLineEnd(data: Uint8Array): number {
  let end = data.indexOf(0xa);
  if (end === -1) {
    end = data.length;
  }

  return end;
}

export function parseJSONFromBuffer<T = unknown>(data: Uint8Array): T {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch (err) {
    console.error(err);
    return {} as T;
  }
}
