import type { IngestResult, TelemetryReader } from "@spotlightjs/spotlight/sdk/core";
import { type PipelineInput, createPipeline } from "@spotlightjs/spotlight/sdk/node";

const pipeline = createPipeline({
  maxPending: 4,
  maxPayloadBytes: 1024,
  maxDecodedBytes: 2048,
  maxRawBytes: 4096,
  rawBufferSize: 3,
  retention: { maxEnvelopes: 10, maxBytes: 8192, maxAgeMs: 1000 },
  enrichStacktrace: async (_event, { signal }) => {
    signal.throwIfAborted();
  },
});
const reader: TelemetryReader = pipeline;
const input: PipelineInput = { body: new Uint8Array(), deliveryId: "request-1", signal: new AbortController().signal };
const receipt: Promise<IngestResult> = pipeline.ingestPayload(input);
const batch: Promise<readonly IngestResult[]> = pipeline.ingestPayloadBatch([input]);
const decoded = pipeline.getDecodedPayload("envelope");
const body: Uint8Array | undefined = decoded?.body;
// @ts-expect-error Serialized payload ingestion has an explicit name.
pipeline.ingest;
// @ts-expect-error Decoded history has an explicit name.
pipeline.getRawPayload;
void reader;
void receipt;
void batch;
void body;
pipeline.dispose();
