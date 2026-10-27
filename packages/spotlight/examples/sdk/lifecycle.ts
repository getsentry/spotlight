import { type RawEnvelope, SDK_CAPABILITIES } from "@spotlightjs/spotlight/sdk/core";
import { createPipeline } from "@spotlightjs/spotlight/sdk/node";
import { createFrontendTelemetry } from "./frontend.js";
import { inspectTrace, readEventIds } from "./reader.js";

// Parsed wire timestamps are seconds; normalized reader timestamps are Unix milliseconds.
function envelope(id: string): RawEnvelope {
  return [
    {},
    [
      [
        { type: "span" },
        {
          version: 2,
          items: [
            {
              trace_id: "example-trace",
              span_id: id,
              name: "SELECT 1",
              start_timestamp: 1,
              end_timestamp: 1.125,
              attributes: { "sentry.op": { type: "string", value: "db.query" } },
            },
          ],
        },
      ],
    ],
  ] as const;
}
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const { ingester, receiveEnvelope, disconnect } = createFrontendTelemetry();
const pipeline = createPipeline();
try {
  const input = envelope("one");
  const first = await receiveEnvelope(input, { deliveryId: "request-1" });
  check(first.status === "processed" && first.retained && first.counts.spans === 1, "Receipt counts");
  const retry = await receiveEnvelope(input, { deliveryId: "request-1" });
  check(retry.status === "ignored" && retry.reason === "duplicate", "Retained delivery retry");

  // Each input gets a receipt. A malformed middle input does not roll back valid neighbors.
  const batch = await ingester.ingestBatch([envelope("two"), null, envelope("three")]);
  check(
    batch[0].status === "processed" && batch[1].status === "invalid" && batch[2].status === "processed",
    "Partial batch",
  );
  if (batch[1].status === "invalid") {
    for (const diagnostic of batch[1].diagnostics) {
      console.log(diagnostic.code, diagnostic.severity, diagnostic.itemIndex);
    }
  }
  const controller = new AbortController();
  controller.abort();
  const cancelled = await ingester.ingestEnvelope(envelope("cancelled"), { signal: controller.signal });
  check(cancelled.status === "ignored" && cancelled.reason === "aborted", "Cancellation receipt");
  await ingester.drain(); // A barrier for work already submitted, not future submissions.
  check(ingester.getStats().pending === 0, "Drained work");

  const reader = inspectTrace(ingester, "example-trace");
  check(JSON.parse(reader.snapshotJson).schemaVersion === 1, "JSON schema");
  check(JSON.parse(reader.profileJson).schemaVersion === 1, "Summary JSON schema");
  const page = ingester.readPage("events", { limit: 1 });
  check(page.status === "ok" && page.nextCursor, "Bounded page");
  await receiveEnvelope(envelope("four"));
  const stale = ingester.readPage("events", { limit: 1, cursor: page.nextCursor });
  check(stale.status === "invalid" && stale.code === "stale_cursor", "Revision-bound cursor");
  check(readEventIds(ingester).status === "ok", "Reader-only pagination");

  const wire = (id: string) => `{}\n${JSON.stringify({ type: "span" })}\n${JSON.stringify(envelope(id)[1][0][1])}`;
  const payloads = await pipeline.ingestPayloadBatch([{ body: wire("node-one") }, { body: "invalid" }]);
  check(payloads[0].status === "processed" && payloads[1].status === "invalid", "Payload batch");
  if (payloads[0].status === "processed") {
    check(pipeline.getDecodedPayload(payloads[0].envelopeId)?.body.length, "Copied decoded payload");
  }
  await pipeline.drain();
  console.log(SDK_CAPABILITIES.timestampUnit, first.counts, ingester.getStats());
} finally {
  pipeline.dispose();
  disconnect();
}
