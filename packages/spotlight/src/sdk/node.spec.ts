// @vitest-environment node
import { readFileSync } from "node:fs";
import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";
import { describe, expect, test, vi } from "vitest";
import { createPipeline } from "./node.ts";

const fixture = readFileSync(new URL("../../_fixtures/envelope_span_v2.txt", import.meta.url));

describe("Node Telemetry adapter", () => {
  test.each(["replay_recording", "future_binary"])(
    "retains an opaque %s item alongside supported telemetry",
    async type => {
      const binary = deflateSync(Buffer.from("binary\nrecording"));
      const body = Buffer.concat([
        Buffer.from('{}\n{"type":"event"}\n{"event_id":"with-opaque-item","timestamp":1}\n'),
        Buffer.from(`${JSON.stringify({ type, length: binary.length })}\n`),
        binary,
      ]);
      const telemetry = createPipeline();
      const result = await telemetry.ingestPayload({ body });
      expect(result.status).toBe("processed");
      expect(telemetry.getEvent("with-opaque-item")).toBeDefined();
      expect(telemetry.getEnvelopes()[0][1][1][1]).toEqual({ data: binary.toString("base64") });
      if (result.status !== "processed") throw new Error("Expected processed envelope");
      expect(telemetry.getDecodedPayload(result.envelopeId)?.body).toEqual(body);
      telemetry.dispose();
    },
  );

  test.each(['{}\n{"type":"attachment","length":0}', '{}\n{"type":"attachment"}'])(
    "rejects a truncated item header without its terminating newline: %s",
    async body => {
      const telemetry = createPipeline();
      expect((await telemetry.ingestPayload({ body })).status).toBe("invalid");
      expect(telemetry.getEnvelopes()).toEqual([]);
      telemetry.dispose();
    },
  );

  test("accepts an empty attachment payload after a complete item header", async () => {
    const telemetry = createPipeline();
    expect((await telemetry.ingestPayload({ body: '{}\n{"type":"attachment","length":0}\n' })).status).toBe("ignored");
    expect(telemetry.getEnvelopes()).toHaveLength(1);
    telemetry.dispose();
  });

  test.each([
    ["processed", fixture],
    ["unsupported", Buffer.from('{}\n{"type":"attachment","length":5}\nhello')],
  ] as const)("subscribers observe %s raw bytes together with the envelope in one notification", async (_, body) => {
    const spotlight = createPipeline();
    const observations: (Buffer | undefined)[] = [];
    spotlight.subscribe(snapshot => {
      const id = String(snapshot.envelopes[0][0].__spotlight_envelope_id);
      observations.push(spotlight.getDecodedPayload(id)?.body);
    });
    await spotlight.ingestPayload({ body });
    expect(observations).toEqual([body]);
  });

  test("raw history bounds already apply when subscribers observe the next envelope", async () => {
    const spotlight = createPipeline({ rawBufferSize: 1 });
    const first = await spotlight.ingestPayload({ body: fixture });
    if (first.status !== "processed") throw new Error("Expected processed envelope");
    const observations: { old: Buffer | undefined; newest: Buffer | undefined }[] = [];
    spotlight.subscribe(snapshot => {
      const envelope = snapshot.envelopes.find(item => String(item[0].__spotlight_envelope_id) !== first.envelopeId)!;
      observations.push({
        old: spotlight.getDecodedPayload(first.envelopeId)?.body,
        newest: spotlight.getDecodedPayload(String(envelope[0].__spotlight_envelope_id))?.body,
      });
    });
    await spotlight.ingestPayload({ body: fixture });
    expect(observations).toEqual([{ old: undefined, newest: fixture }]);
  });

  test("defaults to Sentry envelopes and exposes processed raw payloads", async () => {
    const spotlight = createPipeline();
    const result = await spotlight.ingestPayload({ body: fixture });
    expect(result.status).toBe("processed");
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(spotlight.getQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
    expect(spotlight.getDecodedPayload(result.envelopeId)).toEqual({
      body: fixture,
      contentType: "application/x-sentry-envelope",
    });
  });

  test.each([
    ["identity", (body: Buffer) => body],
    ["gzip", gzipSync],
    ["deflate", deflateSync],
    ["br", brotliCompressSync],
  ] as const)("decodes %s payloads", async (encoding, compress) => {
    const spotlight = createPipeline();
    const result = await spotlight.ingestPayload({
      body: new Uint8Array(compress(fixture)),
      contentType: " Application/X-Sentry-Envelope ; charset=utf-8 ",
      encoding,
    });
    expect(result.status).toBe("processed");
    expect(spotlight.getQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(spotlight.getDecodedPayload(result.envelopeId)?.body).toEqual(fixture);
  });

  test("accepts serialized envelope strings", async () => {
    const spotlight = createPipeline();
    expect((await spotlight.ingestPayload({ body: fixture.toString("utf8") })).status).toBe("processed");
  });

  test("returns an explicit ignored result for unsupported content types", async () => {
    const spotlight = createPipeline();
    expect(await spotlight.ingestPayload({ body: fixture, contentType: "application/json" })).toMatchObject({
      status: "ignored",
      reason: expect.any(String),
    });
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("retains raw payloads for valid envelopes containing only unsupported items", async () => {
    const spotlight = createPipeline();
    const body = Buffer.from('{}\n{"type":"attachment","length":5}\nhello');
    const result = await spotlight.ingestPayload({ body });
    expect(result).toMatchObject({ status: "ignored", reason: "unsupported_items", envelopeId: expect.any(String) });
    if (result.status !== "ignored" || !result.envelopeId) throw new Error("Expected retained unsupported envelope");
    expect(spotlight.getEnvelopes()).toHaveLength(1);
    expect(spotlight.getDecodedPayload(result.envelopeId)?.body).toEqual(body);
  });

  test.each([
    [{ body: fixture, encoding: "zstd" }, "unsupported_encoding"],
    [{ body: fixture, encoding: "gzip" }, "decompression_failed"],
    [{ body: "not an envelope" }, "invalid_envelope"],
    [{ body: "null" }, "invalid_envelope"],
    [{ body: "42" }, "invalid_envelope"],
    [{ body: "[]" }, "invalid_envelope"],
    [{ body: "{}\nnull\n{}" }, "invalid_envelope"],
    [{ body: "{}\n42\n{}" }, "invalid_envelope"],
    [{ body: "{}\n[]\n{}" }, "invalid_envelope"],
    [{ body: '{}\n{"type":"event"}\nnot json' }, "invalid_envelope"],
    [{ body: '{}\n{"type":"attachment","length":100}\nshort' }, "invalid_envelope"],
    [{ body: '{}\n{"type":"attachment","length":-1}\nshort' }, "invalid_envelope"],
    [{ body: '{}\n{"type":"attachment","length":1.5}\nshort' }, "invalid_envelope"],
    [{ body: '{}\n{"type":"attachment","length":"5"}\nshort' }, "invalid_envelope"],
    [{ body: '{}\n{"type":"attachment","length":3}\nshort' }, "invalid_envelope"],
    [{ body: 42 }, "invalid_body"],
  ])("returns diagnostics for malformed input %# without logging", async (input, code) => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logs = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const spotlight = createPipeline();
      // Runtime validation is part of the public boundary.
      const result = await spotlight.ingestPayload(input as Parameters<typeof spotlight.ingestPayload>[0]);
      expect(result).toMatchObject({ status: "invalid", diagnostics: [{ code }] });
      expect(spotlight.getEnvelopes()).toEqual([]);
      expect(errors).not.toHaveBeenCalled();
      expect(warnings).not.toHaveBeenCalled();
      expect(logs).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
    }
  });

  test("copies incoming and returned raw payload bytes", async () => {
    const spotlight = createPipeline();
    const body = Buffer.from(fixture);
    const pending = spotlight.ingestPayload({ body });
    body.fill(0);
    const result = await pending;
    expect(result.status).toBe("processed");
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    const raw = spotlight.getDecodedPayload(result.envelopeId)!;
    expect(raw.body).toEqual(fixture);
    raw.body.fill(0);
    expect(spotlight.getDecodedPayload(result.envelopeId)?.body).toEqual(fixture);
  });

  test("bounds raw payload history independently from processed retention", async () => {
    const spotlight = createPipeline({ rawBufferSize: 1 });
    const first = await spotlight.ingestPayload({ body: fixture });
    const second = await spotlight.ingestPayload({ body: fixture });
    if (first.status !== "processed" || second.status !== "processed") throw new Error("Expected envelopes");
    expect(spotlight.getDecodedPayload(first.envelopeId)).toBeUndefined();
    expect(spotlight.getDecodedPayload(second.envelopeId)?.body).toEqual(fixture);
    expect(spotlight.getEnvelopes()).toHaveLength(2);
    spotlight.reset();
    expect(spotlight.getDecodedPayload(second.envelopeId)).toBeUndefined();
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("invalid ingestion cannot evict a retained raw payload", async () => {
    const spotlight = createPipeline({ rawBufferSize: 1 });
    const first = await spotlight.ingestPayload({ body: fixture });
    if (first.status !== "processed") throw new Error("Expected processed envelope");
    expect((await spotlight.ingestPayload({ body: "not an envelope" })).status).toBe("invalid");
    expect((await spotlight.ingestPayload({ body: "{}\n{}\n{}" })).status).toBe("invalid");
    expect(spotlight.getDecodedPayload(first.envelopeId)?.body).toEqual(fixture);
    expect(spotlight).not.toHaveProperty("buffer");
    expect(spotlight).not.toHaveProperty("store");
  });

  test("retains at most 500 raw payloads by default", async () => {
    const spotlight = createPipeline({ retention: { maxEnvelopes: 1 } });
    const first = await spotlight.ingestPayload({ body: fixture });
    let last = first;
    for (let i = 0; i < 500; i++) last = await spotlight.ingestPayload({ body: fixture });
    if (first.status !== "processed" || last.status !== "processed") throw new Error("Expected envelopes");
    expect(spotlight.getDecodedPayload(first.envelopeId)).toBeUndefined();
    expect(spotlight.getDecodedPayload(last.envelopeId)?.body).toEqual(fixture);
    expect(spotlight.getEnvelopes()).toHaveLength(1);
  });

  test("zero raw buffer capacity still processes telemetry", async () => {
    const spotlight = createPipeline({ rawBufferSize: 0 });
    const result = await spotlight.ingestPayload({ body: fixture });
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(spotlight.getDecodedPayload(result.envelopeId)).toBeUndefined();
    expect(spotlight.getQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
  });

  test("processed age retention does not expire the separate raw history", async () => {
    vi.useFakeTimers();
    const spotlight = createPipeline({ retention: { maxAgeMs: 100 } });
    try {
      const result = await spotlight.ingestPayload({ body: fixture });
      if (result.status !== "processed") throw new Error("Expected processed envelope");
      await vi.advanceTimersByTimeAsync(101);
      expect(spotlight.getEnvelopes()).toEqual([]);
      expect(spotlight.getDecodedPayload(result.envelopeId)?.body).toEqual(fixture);
    } finally {
      spotlight.dispose();
      vi.useRealTimers();
    }
  });

  test.each(["reset", "dispose"] as const)("%s during enrichment cannot restore raw history", async action => {
    let start!: () => void;
    let release!: () => void;
    const started = new Promise<void>(resolve => {
      start = resolve;
    });
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const spotlight = createPipeline({
      enrichStacktrace: async () => {
        start();
        await gate;
      },
    });
    const pending = spotlight.ingestPayload({
      body: [
        "{}",
        '{"type":"event"}',
        JSON.stringify({
          event_id: "pending-error",
          timestamp: 1,
          exception: { values: [{ type: "Error", value: "broken" }] },
        }),
      ].join("\n"),
    });
    await started;
    spotlight[action]();
    release();
    const result = await pending;
    expect(result.status).toBe("ignored");
    if ("envelopeId" in result && result.envelopeId)
      expect(spotlight.getDecodedPayload(result.envelopeId)).toBeUndefined();
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("delivers invalid-input diagnostics to the configured observer", async () => {
    const diagnostics: string[] = [];
    const spotlight = createPipeline({
      onDiagnostic: diagnostic => {
        diagnostics.push(diagnostic.code);
      },
    });
    const result = await spotlight.ingestPayload({ body: fixture, encoding: "zstd" });
    expect(result.status).toBe("invalid");
    expect(diagnostics).toEqual(["unsupported_encoding"]);
  });

  test("throwing diagnostic observers do not reject invalid input", async () => {
    const spotlight = createPipeline({
      onDiagnostic: () => {
        throw new Error("observer failed");
      },
    });
    expect((await spotlight.ingestPayload({ body: fixture, encoding: "zstd" })).status).toBe("invalid");
  });

  test("reset from a subscriber cannot repopulate raw payload history", async () => {
    const spotlight = createPipeline();
    let reset = false;
    spotlight.subscribe(() => {
      if (!reset && spotlight.getEnvelopes().length > 0) {
        reset = true;
        spotlight.reset();
      }
    });
    const result = await spotlight.ingestPayload({ body: fixture });
    expect(reset).toBe(true);
    if ("envelopeId" in result && result.envelopeId)
      expect(spotlight.getDecodedPayload(result.envelopeId)).toBeUndefined();
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("dispose clears raw payloads and prevents subsequent ingestion", async () => {
    const spotlight = createPipeline();
    const result = await spotlight.ingestPayload({ body: fixture });
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    spotlight.dispose();
    expect(spotlight.getDecodedPayload(result.envelopeId)).toBeUndefined();
    expect((await spotlight.ingestPayload({ body: fixture })).status).toBe("ignored");
    expect(spotlight.getEnvelopes()).toEqual([]);
  });
});

describe("bounded payload ingestion", () => {
  test.each([
    ["gzip", gzipSync],
    ["deflate", deflateSync],
    ["br", brotliCompressSync],
  ] as const)("rejects %s expansion at the decompressor output limit", async (encoding, compress) => {
    const pipeline = createPipeline({ maxDecodedBytes: 128 });
    const result = await pipeline.ingestPayload({ body: compress(Buffer.alloc(4096, 65)), encoding });
    expect(result).toMatchObject({
      status: "invalid",
      retained: false,
      diagnostics: [{ code: "decoded_payload_too_large" }],
    });
    expect(pipeline.getEnvelopes()).toEqual([]);
    pipeline.dispose();
  });

  test("enforces input and uncompressed decoded byte limits", async () => {
    const inputLimited = createPipeline({ maxPayloadBytes: 10 });
    expect(await inputLimited.ingestPayload({ body: fixture })).toMatchObject({
      status: "invalid",
      diagnostics: [{ code: "payload_too_large" }],
    });
    inputLimited.dispose();
    const decodedLimited = createPipeline({ maxDecodedBytes: 10 });
    expect(await decodedLimited.ingestPayload({ body: fixture })).toMatchObject({
      status: "invalid",
      diagnostics: [{ code: "decoded_payload_too_large" }],
    });
    decodedLimited.dispose();
  });

  test("evicts raw bytes by total decoded size before notifying subscribers", async () => {
    const pipeline = createPipeline({ maxRawBytes: fixture.length });
    const first = await pipeline.ingestPayload({ body: fixture });
    if (first.status !== "processed") throw new Error("Expected processed envelope");
    const observations: unknown[] = [];
    pipeline.subscribe(snapshot => {
      const newest = String(snapshot.envelopes.at(-1)![0].__spotlight_envelope_id);
      observations.push([pipeline.getDecodedPayload(first.envelopeId), pipeline.getDecodedPayload(newest)?.body]);
    });
    const second = await pipeline.ingestPayload({ body: fixture });
    expect(second.status).toBe("processed");
    expect(observations).toEqual([[undefined, fixture]]);
    pipeline.dispose();
  });

  test("zero raw byte budget disables decoded history", async () => {
    const pipeline = createPipeline({ maxRawBytes: 0 });
    const result = await pipeline.ingestPayload({ body: fixture });
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(pipeline.getDecodedPayload(result.envelopeId)).toBeUndefined();
    pipeline.dispose();
  });

  test("forwards delivery identity and abort signals to processing", async () => {
    const pipeline = createPipeline();
    const first = await pipeline.ingestPayload({ body: fixture, deliveryId: "wire-delivery" });
    const duplicate = await pipeline.ingestPayload({ body: fixture, deliveryId: "wire-delivery" });
    expect(first.status).toBe("processed");
    expect(duplicate).toMatchObject({ status: "ignored", reason: "duplicate" });
    const controller = new AbortController();
    controller.abort();
    expect(await pipeline.ingestPayload({ body: fixture, signal: controller.signal })).toMatchObject({
      status: "ignored",
      reason: "aborted",
    });
    expect(pipeline.getEnvelopes()).toHaveLength(1);
    pipeline.dispose();
  });

  test.each(["reset", "dispose"] as const)("%s cancels asynchronous decompression", async action => {
    const pipeline = createPipeline();
    const pending = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip" });
    await Promise.resolve();
    pipeline[action]();
    expect(await pending).toMatchObject({ status: "ignored", reason: action === "dispose" ? "disposed" : "reset" });
    expect(pipeline.getEnvelopes()).toEqual([]);
    pipeline.dispose();
  });

  test("bounds concurrently admitted payloads and drain includes decoding", async () => {
    const pipeline = createPipeline({ maxPending: 1 });
    const first = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip" });
    expect(await pipeline.ingestPayload({ body: fixture })).toMatchObject({ status: "ignored", reason: "queue_full" });
    await pipeline.drain();
    expect((await first).status).toBe("processed");
    expect(pipeline.getEnvelopes()).toHaveLength(1);
    pipeline.dispose();
  });

  test("payload batches retain order and isolate invalid entries", async () => {
    const pipeline = createPipeline();
    const results = await pipeline.ingestPayloadBatch([
      { body: fixture, deliveryId: "first" },
      { body: "invalid" },
      { body: fixture, deliveryId: "first" },
    ]);
    expect(results.map(result => result.status)).toEqual(["processed", "invalid", "ignored"]);
    expect(results[2]).toMatchObject({ reason: "duplicate" });
    pipeline.dispose();
  });
});

describe("payload lifecycle boundaries", () => {
  test("delivery IDs key decoded history before public subscriptions", async () => {
    const pipeline = createPipeline();
    const observed: unknown[] = [];
    pipeline.subscribe(snapshot => {
      const id = String(snapshot.envelopes[0][0].__spotlight_envelope_id);
      observed.push([id, pipeline.getDecodedPayload(id)?.body]);
    });
    const result = await pipeline.ingestPayload({ body: fixture, deliveryId: "effective-wire-id" });
    expect(result).toMatchObject({ status: "processed", envelopeId: "effective-wire-id" });
    expect(observed).toEqual([["effective-wire-id", fixture]]);
    pipeline.dispose();
  });

  test("an abort during enrichment releases the payload queue without publishing raw data", async () => {
    let start!: () => void;
    let release!: () => void;
    const started = new Promise<void>(resolve => {
      start = resolve;
    });
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const controller = new AbortController();
    const pipeline = createPipeline({
      enrichStacktrace: async () => {
        start();
        await gate;
      },
    });
    const pending = pipeline.ingestPayload({
      body: '{}\n{"type":"event"}\n{"event_id":"aborted-error","timestamp":1,"exception":{"values":[]}}',
      signal: controller.signal,
      deliveryId: "aborted-wire-id",
    });
    await started;
    controller.abort();
    expect(await pending).toMatchObject({ status: "ignored", reason: "aborted" });
    expect(pipeline.getDecodedPayload("aborted-wire-id")).toBeUndefined();
    expect((await pipeline.ingestPayload({ body: fixture })).status).toBe("processed");
    release();
    await pipeline.drain();
    expect(pipeline.getEvent("aborted-error")).toBeUndefined();
    pipeline.dispose();
  });

  test("aborting decompression does not retain or process the decoded output", async () => {
    const pipeline = createPipeline();
    const controller = new AbortController();
    const pending = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip", signal: controller.signal });
    await Promise.resolve();
    controller.abort();
    expect(await pending).toMatchObject({ status: "ignored", reason: "aborted" });
    expect(pipeline.getEnvelopes()).toEqual([]);
    pipeline.dispose();
  });

  test.each(["maxPayloadBytes", "maxDecodedBytes", "maxRawBytes", "rawBufferSize"] as const)(
    "validates %s configuration",
    name => {
      for (const invalid of [-1, 0.1, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
        expect(() => createPipeline({ [name]: invalid })).toThrow(RangeError);
      }
      if (name === "maxPayloadBytes" || name === "maxDecodedBytes") {
        expect(() => createPipeline({ [name]: 0 })).toThrow(RangeError);
      }
    },
  );
});

test("Node pending stats include queued decode work and reset releases admission capacity", async () => {
  const pipeline = createPipeline({ maxPending: 1 });
  const old = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip" });
  expect(pipeline.getStats().pending).toBe(1);
  await Promise.resolve();
  pipeline.reset();
  expect(pipeline.getStats().pending).toBe(0);
  const next = pipeline.ingestPayload({ body: fixture });
  expect(pipeline.getStats().pending).toBe(1);
  expect(await old).toMatchObject({ status: "ignored", reason: "reset" });
  expect((await next).status).toBe("processed");
  expect(pipeline.getStats().pending).toBe(0);
  pipeline.dispose();
});

test("Node drain excludes payloads admitted after its barrier", async () => {
  let start!: () => void;
  let release!: () => void;
  const started = new Promise<void>(resolve => {
    start = resolve;
  });
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const pipeline = createPipeline({
    enrichStacktrace: async () => {
      start();
      await gate;
    },
  });
  const first = pipeline.ingestPayload({ body: fixture });
  const drained = pipeline.drain();
  const later = pipeline.ingestPayload({
    body: '{}\n{"type":"event"}\n{"event_id":"later-error","timestamp":1,"exception":{"values":[]}}',
  });
  await started;
  await drained;
  expect((await first).status).toBe("processed");
  expect(pipeline.getEvent("later-error")).toBeUndefined();
  release();
  expect((await later).status).toBe("processed");
  pipeline.dispose();
});

test("drain includes every entry of an already-submitted payload batch", async () => {
  const pipeline = createPipeline({ maxPending: 1 });
  const batch = pipeline.ingestPayloadBatch([
    { body: gzipSync(fixture), encoding: "gzip", deliveryId: "batch-first" },
    { body: gzipSync(fixture), encoding: "gzip", deliveryId: "batch-second" },
  ]);
  await pipeline.drain();
  expect(pipeline.getEnvelopes()).toHaveLength(2);
  expect((await batch).map(result => result.status)).toEqual(["processed", "processed"]);
  pipeline.dispose();
});

test("reset cancels the remaining entries of a submitted payload batch", async () => {
  const pipeline = createPipeline();
  const batch = pipeline.ingestPayloadBatch([
    { body: gzipSync(fixture), encoding: "gzip", deliveryId: "batch-first" },
    { body: fixture, deliveryId: "batch-second" },
  ]);
  await Promise.resolve();
  pipeline.reset();
  const results = await batch;
  expect(results).toMatchObject([
    { status: "ignored", reason: "reset" },
    { status: "ignored", reason: "reset" },
  ]);
  expect(pipeline.getEnvelopes()).toEqual([]);
  expect(pipeline.getDecodedPayload("batch-second")).toBeUndefined();
  pipeline.dispose();
});

test("a queued payload batch stays ahead of later payload work", async () => {
  let start!: () => void;
  let release!: () => void;
  const started = new Promise<void>(resolve => {
    start = resolve;
  });
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const pipeline = createPipeline({
    enrichStacktrace: async () => {
      start();
      await gate;
    },
  });
  const batch = pipeline.ingestPayloadBatch([
    { body: gzipSync(fixture), encoding: "gzip", deliveryId: "batch-first" },
    { body: fixture, deliveryId: "batch-second" },
  ]);
  const drained = pipeline.drain();
  const later = pipeline.ingestPayload({
    body: '{}\n{"type":"event"}\n{"event_id":"later-blocker","timestamp":1,"exception":{"values":[]}}',
  });
  await started;
  expect(pipeline.getEnvelope("batch-second")).toBeDefined();
  await drained;
  expect((await batch).map(result => result.status)).toEqual(["processed", "processed"]);
  release();
  await later;
  pipeline.dispose();
});

describe("one Node admission queue for every input method", () => {
  const parsedEvent = (id: string, error = false) => [
    {},
    [[{ type: "event" }, { event_id: id, timestamp: 1, ...(error ? { exception: { values: [] } } : {}) }]],
  ];

  test.each(["ingestEnvelope", "ingestBatch"] as const)("wire admission bounds later %s calls", async method => {
    const pipeline = createPipeline({ maxPending: 1 });
    const wire = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip" });
    const input = parsedEvent("later-parsed");
    const later =
      method === "ingestEnvelope" ? await pipeline.ingestEnvelope(input) : (await pipeline.ingestBatch([input]))[0];
    expect(later).toMatchObject({ status: "ignored", reason: "queue_full" });
    expect(pipeline.getStats().pending).toBe(1);
    expect((await wire).status).toBe("processed");
    expect(pipeline.getEvent("later-parsed")).toBeUndefined();
    pipeline.dispose();
  });

  test.each(["ingestPayload", "ingestPayloadBatch"] as const)(
    "parsed admission bounds later %s calls",
    async method => {
      const pipeline = createPipeline({ maxPending: 1 });
      const parsed = pipeline.ingestEnvelope(parsedEvent("first-parsed"));
      const input = { body: fixture };
      const later =
        method === "ingestPayload"
          ? await pipeline.ingestPayload(input)
          : (await pipeline.ingestPayloadBatch([input]))[0];
      expect(later).toMatchObject({ status: "ignored", reason: "queue_full" });
      expect(pipeline.getStats().pending).toBe(1);
      expect((await parsed).status).toBe("processed");
      pipeline.dispose();
    },
  );

  test.each(["ingestEnvelope", "ingestBatch"] as const)("wire drain excludes a later gated %s", async method => {
    let start!: () => void;
    let release!: () => void;
    const started = new Promise<void>(resolve => {
      start = resolve;
    });
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const pipeline = createPipeline({
      enrichStacktrace: async () => {
        start();
        await gate;
      },
    });
    const wire = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip" });
    const drained = pipeline.drain();
    const input = parsedEvent("later-gated-parsed", true);
    const later = method === "ingestEnvelope" ? pipeline.ingestEnvelope(input) : pipeline.ingestBatch([input]);
    await started;
    // The wire job must commit first; its already-captured barrier must settle while later work is gated.
    expect(pipeline.getQuerySummaries()).toHaveLength(1);
    await drained;
    expect((await wire).status).toBe("processed");
    release();
    await later;
    pipeline.dispose();
  });

  test("parsed batches retain order ahead of later wire jobs", async () => {
    const pipeline = createPipeline();
    const seen: string[] = [];
    pipeline.subscribe((_snapshot, change) => {
      if (change.type === "ingest") seen.push(...change.envelopeIds);
    });
    const batch = pipeline.ingestBatch([
      [{ __spotlight_envelope_id: "parsed-first" }, []],
      [{ __spotlight_envelope_id: "parsed-second" }, []],
    ]);
    const wire = pipeline.ingestPayload({ body: fixture, deliveryId: "wire-third" });
    await pipeline.drain();
    expect(seen).toEqual(["parsed-first", "parsed-second", "wire-third"]);
    expect((await batch).map(item => item.status)).toEqual(["ignored", "ignored"]);
    expect((await wire).status).toBe("processed");
    pipeline.dispose();
  });

  test("copied standalone parsed inputs retain weak object identity across calls and batches", async () => {
    const pipeline = createPipeline();
    const input = parsedEvent("copied-input");
    const pending = pipeline.ingestEnvelope(input);
    input[1] = [];
    const first = await pending;
    expect(first.status).toBe("processed");
    expect(pipeline.getEvent("copied-input")).toBeDefined();
    const second = await pipeline.ingestEnvelope(input);
    expect(second).toMatchObject({
      status: "ignored",
      reason: "duplicate",
      envelopeId: "envelopeId" in first ? first.envelopeId : "missing",
    });
    expect((await pipeline.ingestBatch([input, input])).map(item => item.status)).toEqual(["ignored", "ignored"]);
    expect(pipeline.getEnvelopes()).toHaveLength(1);
    expect(input[0]).not.toHaveProperty("__spotlight_envelope_id");
    pipeline.dispose();
  });

  test("prune calls coalesce without exceeding a full shared queue", async () => {
    const pipeline = createPipeline({ maxPending: 1 });
    const wire = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip" });
    const first = pipeline.prune();
    const second = pipeline.prune();
    expect(second).toBe(first);
    expect(pipeline.getStats().pending).toBe(1);
    await Promise.all([wire, first, pipeline.drain()]);
    expect(pipeline.getStats().pending).toBe(0);
    pipeline.dispose();
  });
});

test("parsed batch clone failures produce per-item receipts and preserve later inputs", async () => {
  const pipeline = createPipeline();
  const uncloneable = [{ bad: () => {} }, []];
  const good = [{}, [[{ type: "event" }, { event_id: "after-clone-failure", timestamp: 1 }]]];
  const results = await pipeline.ingestBatch([uncloneable, good, good]);
  expect(results).toMatchObject([
    { status: "invalid", diagnostics: [{ code: "invalid_envelope" }] },
    { status: "processed" },
    { status: "ignored", reason: "duplicate" },
  ]);
  expect(pipeline.getEnvelopes()).toHaveLength(1);
  expect(Object.isFrozen(results[0].diagnostics[0])).toBe(true);
  pipeline.dispose();
});

test("reset invalidates queued parsed jobs and the remaining parsed batch entries", async () => {
  const pipeline = createPipeline();
  const wire = pipeline.ingestPayload({ body: gzipSync(fixture), encoding: "gzip" });
  const parsed = pipeline.ingestEnvelope([{}, []]);
  const batch = pipeline.ingestBatch([
    [{}, []],
    [{}, []],
  ]);
  pipeline.reset();
  expect(await wire).toMatchObject({ status: "ignored", reason: "reset" });
  expect(await parsed).toMatchObject({ status: "ignored", reason: "reset" });
  expect(await batch).toMatchObject([
    { status: "ignored", reason: "reset" },
    { status: "ignored", reason: "reset" },
  ]);
  expect(pipeline.getStats().pending).toBe(0);
  expect(pipeline.getEnvelopes()).toEqual([]);
  pipeline.dispose();
});

test("diagnostic callbacks cannot bypass shared admission during core validation", async () => {
  const later: Promise<import("./core.ts").IngestResult>[] = [];
  const observed: number[] = [];
  const pipeline = createPipeline({
    maxPending: 1,
    onDiagnostic() {
      observed.push(pipeline.getStats().pending);
      later.push(pipeline.ingestPayload({ body: fixture }));
    },
  });
  const invalid = await pipeline.ingestEnvelope([{}, [[{ type: "span" }, { span_id: "invalid" }]]]);
  expect(invalid.status).toBe("invalid");
  expect(observed).toEqual([1]);
  expect(await Promise.all(later)).toMatchObject([{ status: "ignored", reason: "queue_full" }]);
  pipeline.dispose();
});
