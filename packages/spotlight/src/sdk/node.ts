import { Buffer } from "node:buffer";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { processEnvelope } from "../server/parser/processEnvelope.ts";
import { type Diagnostic, type IngestResult, type Ingester, type IngesterOptions, createIngester } from "./core.ts";

export type { IngesterSnapshot as PipelineSnapshot } from "./core.ts";

export type PipelineOptions = IngesterOptions & {
  /**
   * Maximum decoded raw payloads to retain (default 500); zero disables storage.
   * This history is independent of processed telemetry retention and prune().
   */
  rawBufferSize?: number;
};

export type PipelineInput = {
  body: Uint8Array | string;
  contentType?: string;
  encoding?: string;
  userAgent?: string;
};

export type RawPayload = { body: Buffer; contentType: string };
export type Pipeline = Ingester & {
  ingest(input: PipelineInput): Promise<IngestResult>;
  getRawPayload(envelopeId: string): RawPayload | undefined;
};

const envelopeContentType = "application/x-sentry-envelope";
const decompressors = new Map<string, (body: Buffer) => Buffer>([
  ["gzip", gunzipSync],
  ["deflate", inflateSync],
  ["br", brotliDecompressSync],
]);

/** Decode serialized Sentry envelopes with Node APIs, then process them through the shared ingester. */
export function createPipeline(options: PipelineOptions = {}): Pipeline {
  const rawBufferSize = options.rawBufferSize ?? 500;
  if (!Number.isSafeInteger(rawBufferSize) || rawBufferSize < 0) {
    throw new RangeError("rawBufferSize must be a non-negative safe integer");
  }
  const telemetry = createIngester(options);
  const rawPayloads = new Map<string, RawPayload>();
  const stagedPayloads = new Map<string, RawPayload>();
  let generation = 0;
  let disposed = false;

  function retainRawPayload(envelopeId: string, payload: RawPayload) {
    rawPayloads.set(envelopeId, payload);
    while (rawPayloads.size > rawBufferSize) rawPayloads.delete(rawPayloads.keys().next().value!);
  }

  // Register before public listeners so raw history commits with the core snapshot.
  telemetry.subscribe(snapshot => {
    for (const envelope of snapshot.envelopes) {
      const envelopeId = String(envelope[0].__spotlight_envelope_id);
      const payload = stagedPayloads.get(envelopeId);
      if (!payload) continue;
      stagedPayloads.delete(envelopeId);
      retainRawPayload(envelopeId, payload);
    }
  });

  function invalid(code: string, message: string): IngestResult {
    const diagnostic: Diagnostic = { code, message };
    try {
      options.onDiagnostic?.(diagnostic);
    } catch {
      // A diagnostic observer cannot turn invalid input into a rejected ingestion.
    }
    return { status: "invalid", diagnostics: [diagnostic] };
  }

  return {
    ...telemetry,
    async ingest(input) {
      if (disposed) return { status: "ignored", reason: "disposed", diagnostics: [] };
      const currentGeneration = generation;
      if (!input || (typeof input.body !== "string" && !(input.body instanceof Uint8Array))) {
        return invalid("invalid_body", "Envelope body must be a string or Uint8Array");
      }
      if (input.contentType !== undefined && typeof input.contentType !== "string") {
        return invalid("invalid_content_type", "Content type must be a string");
      }
      const contentType = (input.contentType ?? envelopeContentType).split(";")[0].trim().toLowerCase();
      if (contentType !== envelopeContentType) {
        return { status: "ignored", reason: "unsupported_content_type", diagnostics: [] };
      }
      if (input.encoding !== undefined && typeof input.encoding !== "string") {
        return invalid("unsupported_encoding", "Content encoding must be a string");
      }
      const encoding = input.encoding?.trim().toLowerCase();
      const decompress = encoding ? decompressors.get(encoding) : undefined;
      if (encoding && encoding !== "identity" && !decompress) {
        return invalid("unsupported_encoding", `Unsupported content encoding: ${encoding}`);
      }

      // Copy before the first await so caller mutations cannot affect parsing or raw history.
      let body: Buffer = typeof input.body === "string" ? Buffer.from(input.body, "utf8") : Buffer.from(input.body);
      if (decompress) {
        try {
          body = decompress(body);
        } catch {
          return invalid("decompression_failed", "Could not decompress the envelope body");
        }
      }

      let parseFailed = false;
      let parsed: ReturnType<typeof processEnvelope> = null;
      try {
        parsed = processEnvelope(
          { contentType, data: body },
          input.userAgent,
          () => {
            parseFailed = true;
          },
          true,
        );
      } catch {
        parseFailed = true;
      }
      if (!parsed || parseFailed) return invalid("invalid_envelope", "Malformed serialized Sentry envelope");

      const envelopeId = String(parsed.envelope[0].__spotlight_envelope_id);
      const payload = { body, contentType };
      if (rawBufferSize > 0) stagedPayloads.set(envelopeId, payload);
      try {
        const result = await telemetry.ingestEnvelope(parsed.envelope);
        const retainPayload =
          result.status === "processed" || (result.status === "ignored" && result.reason === "unsupported_items");
        if (
          retainPayload &&
          "envelopeId" in result &&
          result.envelopeId &&
          generation === currentGeneration &&
          !disposed &&
          stagedPayloads.get(envelopeId) === payload
        ) {
          // Age retention can remove an envelope before publication; raw history remains independent.
          retainRawPayload(result.envelopeId, payload);
        }
        return result;
      } finally {
        if (stagedPayloads.get(envelopeId) === payload) stagedPayloads.delete(envelopeId);
      }
    },
    getRawPayload(envelopeId) {
      const payload = rawPayloads.get(envelopeId);
      return payload && { body: Buffer.from(payload.body), contentType: payload.contentType };
    },
    reset() {
      generation += 1;
      rawPayloads.clear();
      stagedPayloads.clear();
      telemetry.reset();
    },
    dispose() {
      disposed = true;
      generation += 1;
      rawPayloads.clear();
      stagedPayloads.clear();
      telemetry.dispose();
    },
  };
}
