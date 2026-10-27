// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { createPipeline } from "../sdk/node.ts";
import { createIngester } from "./index.ts";

const event = (id = "event") => [{}, [[{ type: "event" }, { event_id: id, timestamp: 1 }]]];
const error = (id = "error") => [
  {},
  [[{ type: "event" }, { event_id: id, timestamp: 1, exception: { values: [{ type: "Error", value: "original" }] } }]],
];
afterEach(() => vi.useRealTimers());

test.each(["core", "node"] as const)("%s pruning after full-queue no-op work still enforces expiry", async runtime => {
  vi.useFakeTimers();
  const client =
    runtime === "core"
      ? createIngester({ maxPending: 1, retention: { maxAgeMs: 1000 } })
      : createPipeline({ maxPending: 1, retention: { maxAgeMs: 1000 } });
  await client.ingestEnvelope(event());
  vi.setSystemTime(Date.now() + 10000);
  const work = "ingestPayload" in client ? client.ingestPayload({ body: "bad" }) : client.ingestBatch([]);
  await Promise.all([work, client.prune()]);
  expect(client.getEnvelopes()).toEqual([]);
  expect(client.getStats().pending).toBe(0);
  client.dispose();
});

test("pruning is coalesced and cannot bypass the configured pending limit", async () => {
  const ingester = createIngester({ maxPending: 1 });
  const operations = Array.from({ length: 100 }, () => ingester.prune());
  expect(ingester.getStats().pending).toBeLessThanOrEqual(1);
  expect(operations[0]).toBe(operations[99]);
  await Promise.all(operations);
  expect(ingester.getStats().pending).toBe(0);
  ingester.dispose();
});

test("large enrichment deadlines do not overflow Node timers", async () => {
  vi.useFakeTimers();
  const ingester = createIngester({
    enrichmentTimeoutMs: 2147483648,
    enrichStacktrace: async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    },
  });
  const pending = ingester.ingestEnvelope(error());
  await vi.advanceTimersByTimeAsync(10);
  expect(await pending).toMatchObject({ status: "processed", diagnostics: [] });
  ingester.dispose();
});

test("receipts distinguish retained unsupported data and no-op duplicates", async () => {
  const ingester = createIngester();
  const first = await ingester.ingestEnvelope(event(), { deliveryId: "delivery" });
  expect(first).toMatchObject({
    status: "processed",
    envelopeId: "delivery",
    retained: true,
    revision: 1,
    counts: { events: 1, duplicateEvents: 0 },
  });
  expect(await ingester.ingestEnvelope(event(), { deliveryId: "delivery" })).toMatchObject({
    status: "ignored",
    reason: "duplicate",
    retained: true,
    revision: 1,
  });
  expect(await ingester.ingestEnvelope([{}, [[{ type: "future" }, {}]]])).toMatchObject({
    status: "ignored",
    reason: "unsupported_items",
    retained: true,
    revision: 2,
    counts: { skippedItems: 1 },
  });
  expect(Object.isFrozen(first.counts)).toBe(true);
  ingester.dispose();
});

test("batch ingestion preserves order and a drain barrier covers earlier work", async () => {
  const ingester = createIngester();
  const batch = ingester.ingestBatch([event("one"), null, event("two")]);
  await ingester.drain();
  expect((await batch).map(result => result.status)).toEqual(["processed", "invalid", "processed"]);
  expect(ingester.getEvents().map(item => item.event_id)).toEqual(["one", "two"]);
  expect(ingester.getStats().pending).toBe(0);
  ingester.dispose();
});

test("batches are one queued operation and drain does not wait for later submissions", async () => {
  let releaseFirst!: () => void;
  let releaseLater!: () => void;
  let enteredFirst!: () => void;
  const ready = new Promise<void>(resolve => {
    enteredFirst = resolve;
  });
  const ingester = createIngester({
    enrichStacktrace: async item => {
      if (item.event_id === "first") {
        enteredFirst();
        await new Promise<void>(resolve => {
          releaseFirst = resolve;
        });
      }
      if (item.event_id === "later")
        await new Promise<void>(resolve => {
          releaseLater = resolve;
        });
    },
  });
  const batch = ingester.ingestBatch([error("first"), event("second")]);
  const barrier = ingester.drain();
  const later = ingester.ingestEnvelope(error("later"));
  await ready;
  releaseFirst();
  await barrier;
  expect((await batch).map(result => result.status)).toEqual(["processed", "processed"]);
  expect(ingester.getEvent("second")).toBeDefined();
  // The later hook may start, but it cannot keep the earlier barrier pending.
  await vi.waitFor(() => expect(releaseLater).toBeTypeOf("function"));
  releaseLater();
  await later;
  ingester.dispose();
});

test("a timed out hook cannot mutate committed telemetry or block later work", async () => {
  vi.useFakeTimers();
  let finish!: () => void;
  const ingester = createIngester({
    enrichmentTimeoutMs: 20,
    enrichStacktrace: async item => {
      await new Promise<void>(resolve => {
        finish = resolve;
      });
      item.exception.values![0].value = "late";
    },
  });
  const captured = ingester.ingestEnvelope(error());
  const later = ingester.ingestEnvelope(event("later"));
  await vi.advanceTimersByTimeAsync(20);
  expect(await captured).toMatchObject({
    status: "processed",
    diagnostics: [{ code: "enrichment_timeout", severity: "warning" }],
  });
  expect((await later).status).toBe("processed");
  finish();
  await Promise.resolve();
  expect(ingester.getErrors()[0].exception.values![0].value).toBe("original");
  ingester.dispose();
});

test("queue capacity and abort have structured outcomes and release capacity", async () => {
  let entered!: () => void;
  const ready = new Promise<void>(resolve => {
    entered = resolve;
  });
  const ingester = createIngester({
    maxPending: 1,
    enrichStacktrace: async (_item, { signal }) => {
      entered();
      await new Promise<void>(resolve => signal.addEventListener("abort", () => resolve(), { once: true }));
    },
  });
  const controller = new AbortController();
  const active = ingester.ingestEnvelope(error(), { signal: controller.signal });
  await ready;
  expect(await ingester.ingestEnvelope(event())).toMatchObject({
    status: "ignored",
    reason: "queue_full",
    retained: false,
  });
  controller.abort();
  expect(await active).toMatchObject({ status: "ignored", reason: "aborted" });
  expect(ingester.getEvents()).toEqual([]);
  expect((await ingester.ingestEnvelope(event())).status).toBe("processed");
  ingester.dispose();
});

test("abort during post-ingestion retention replay restores the prior committed history", async () => {
  let replaying!: () => void;
  const replayReady = new Promise<void>(resolve => {
    replaying = resolve;
  });
  let calls = 0;
  let replaySignal: AbortSignal | undefined;
  const ingester = createIngester({
    retention: { maxEnvelopes: 1 },
    enrichStacktrace: async (_event, { signal }) => {
      if (++calls === 1) return;
      replaySignal = signal;
      replaying();
      await new Promise<void>(resolve => signal.addEventListener("abort", () => resolve(), { once: true }));
    },
  });
  await ingester.ingestEnvelope(error("same"), { deliveryId: "one" });
  const snapshot = ingester.getSnapshot();
  const controller = new AbortController();
  const aborted = ingester.ingestEnvelope(error("same"), { deliveryId: "two", signal: controller.signal });
  await replayReady;
  controller.abort();
  expect(await aborted).toMatchObject({ status: "ignored", reason: "aborted", retained: false });
  expect(replaySignal?.aborted).toBe(true);
  expect(ingester.getSnapshot()).toBe(snapshot);
  expect(ingester.getEnvelope("one")).toBeDefined();
  expect(ingester.getEnvelope("two")).toBeUndefined();
  expect(calls).toBe(2);
  ingester.dispose();
});

test("byte retention evicts dependent data and delivery keys have the same lifetime", async () => {
  const ingester = createIngester({ retention: { maxBytes: 100 } });
  await ingester.ingestEnvelope(event("one"), { deliveryId: "one" });
  await ingester.ingestEnvelope(event("two"), { deliveryId: "two" });
  expect(ingester.getStats().retainedBytes).toBeLessThanOrEqual(100);
  expect(ingester.getEvent("one")).toBeUndefined();
  expect((await ingester.ingestEnvelope(event("one"), { deliveryId: "one" })).status).toBe("processed");
  ingester.dispose();
});

test("changes identify ingestion, eviction and reset while callbacks see committed reads", async () => {
  const ingester = createIngester({ retention: { maxEnvelopes: 1 } });
  const changes: string[] = [];
  ingester.subscribe((snapshot, change) => {
    expect(snapshot).toBe(ingester.getSnapshot());
    changes.push(change.type);
  });
  await ingester.ingestEnvelope(event("one"));
  await ingester.ingestEnvelope(event("two"));
  ingester.reset();
  expect(changes).toEqual(["ingest", "ingest", "reset"]);
  ingester.dispose();
});
