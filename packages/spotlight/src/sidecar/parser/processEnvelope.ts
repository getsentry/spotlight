import type { Envelope, EnvelopeItem } from "@sentry/core";
import { uuidv7 } from "uuidv7";
import { RAW_TYPES } from "../constants.js";
import { logger } from "../logger.js";
import type { RawEventContext } from "./types.js";

export type ParsedEnvelope = {
  envelope: Envelope;
  rawEnvelope: RawEventContext;
};

const TEXT_CONTENT_TYPES = new Set([
  "text/plain",
  "text/css",
  "text/csv",
  "text/html",
  "text/javascript",
  "text/json",
  "text/x-json",
  "application/json",
  "application/ld+json",
  "application/json",
]);

/**
 * Implements parser for
 * @see https://develop.sentry.dev/sdk/envelopes/#serialization-format
 * @param rawEvent Envelope data
 * @returns parsed envelope
 */
export function processEnvelope(rawEvent: RawEventContext): ParsedEnvelope | null {
  let buffer = typeof rawEvent.data === "string" ? Uint8Array.from(rawEvent.data, c => c.charCodeAt(0)) : rawEvent.data;

  function readLine(length?: number) {
    const cursor = length ?? getLineEnd(buffer);
    const line = buffer.subarray(0, cursor);
    buffer = buffer.subarray(cursor + 1);
    return line;
  }

  const envelopeHeader = parseJSONFromBuffer(readLine()) as Envelope[0];
  if (!envelopeHeader) {
    logger.error("Malformed envelope header, skipping...");
    return null;
  }

  envelopeHeader.__spotlight_envelope_id = uuidv7();

  const items: EnvelopeItem[] = [];
  while (buffer.length) {
    const itemHeader = parseJSONFromBuffer(readLine()) as EnvelopeItem[0];
    const payloadLength = itemHeader.length;
    const itemPayloadRaw = readLine(payloadLength);

    let itemPayload: EnvelopeItem[1];
    try {
      if (RAW_TYPES.has(itemHeader.type)) {
        const rawPayload = itemPayloadRaw as Buffer;
        if (
          !itemHeader.content_type &&
          // @ts-expect-error -- statsd is an old and deprecated event type but have envelopes for that
          itemHeader.type === "statsd"
        ) {
          // @ts-expect-error -- same as above
          itemHeader.content_type = "text/plain";
        }
        itemPayload = {
          data: rawPayload.toString(TEXT_CONTENT_TYPES.has(itemHeader.content_type as string) ? "utf-8" : "base64"),
        } as EnvelopeItem[1];
      } else {
        itemPayload = parseJSONFromBuffer(itemPayloadRaw);
        if (!itemPayload) {
          logger.error(itemHeader);
        } else if (itemHeader.type) {
          // data sanitization
          // @ts-expect-error ts(2339) -- We should really stop adding type to payloads
          itemPayload.type = itemHeader.type;
        }
      }
    } catch (err) {
      itemPayload = itemPayloadRaw;
      logger.error(err);
    }

    items.push([itemHeader, itemPayload] as EnvelopeItem);
  }

  return {
    envelope: [envelopeHeader, items] as Envelope,
    rawEnvelope: rawEvent,
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
    return null as T;
  }
}
