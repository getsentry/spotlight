import { type DecodedEnvelope, decodeEnvelope } from "../../telemetry/envelope/codec.ts";
import { logger } from "../logger.ts";
import type { RawEventContext } from "./types.ts";

export type { SpotlightEnvelopeExtensions } from "../../telemetry/envelope/codec.ts";
export type ParsedEnvelope = { envelope: DecodedEnvelope; rawEnvelope: RawEventContext };

/** Legacy sidecar wrapper: preserve permissive parsing and default logger reporting. */
export function processEnvelope(
  rawEvent: RawEventContext,
  senderUserAgent?: string,
  reportError: (error: unknown) => void = error => logger.error(error),
  strict = false,
): ParsedEnvelope | null {
  const bytes =
    typeof rawEvent.data === "string" ? Uint8Array.from(rawEvent.data, c => c.charCodeAt(0)) : rawEvent.data;
  const envelope = decodeEnvelope(bytes, senderUserAgent, reportError, strict);
  return envelope ? { envelope, rawEnvelope: rawEvent } : null;
}
