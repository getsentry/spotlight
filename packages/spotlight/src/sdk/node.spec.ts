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
      const result = await telemetry.ingest({ body });
      expect(result.status).toBe("processed");
      expect(telemetry.getEvent("with-opaque-item")).toBeDefined();
      expect(telemetry.getEnvelopes()[0][1][1][1]).toEqual({ data: binary.toString("base64") });
      if (result.status !== "processed") throw new Error("Expected processed envelope");
      expect(telemetry.getRawPayload(result.envelopeId)?.body).toEqual(body);
      telemetry.dispose();
    },
  );

  test.each(['{}\n{"type":"attachment","length":0}', '{}\n{"type":"attachment"}'])(
    "rejects a truncated item header without its terminating newline: %s",
    async body => {
      const telemetry = createPipeline();
      expect((await telemetry.ingest({ body })).status).toBe("invalid");
      expect(telemetry.getEnvelopes()).toEqual([]);
      telemetry.dispose();
    },
  );

  test("accepts an empty attachment payload after a complete item header", async () => {
    const telemetry = createPipeline();
    expect((await telemetry.ingest({ body: '{}\n{"type":"attachment","length":0}\n' })).status).toBe("ignored");
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
      observations.push(spotlight.getRawPayload(id)?.body);
    });
    await spotlight.ingest({ body });
    expect(observations).toEqual([body]);
  });

  test("raw history bounds already apply when subscribers observe the next envelope", async () => {
    const spotlight = createPipeline({ rawBufferSize: 1 });
    const first = await spotlight.ingest({ body: fixture });
    if (first.status !== "processed") throw new Error("Expected processed envelope");
    const observations: { old: Buffer | undefined; newest: Buffer | undefined }[] = [];
    spotlight.subscribe(snapshot => {
      const envelope = snapshot.envelopes.find(item => String(item[0].__spotlight_envelope_id) !== first.envelopeId)!;
      observations.push({
        old: spotlight.getRawPayload(first.envelopeId)?.body,
        newest: spotlight.getRawPayload(String(envelope[0].__spotlight_envelope_id))?.body,
      });
    });
    await spotlight.ingest({ body: fixture });
    expect(observations).toEqual([{ old: undefined, newest: fixture }]);
  });

  test("defaults to Sentry envelopes and exposes processed raw payloads", async () => {
    const spotlight = createPipeline();
    const result = await spotlight.ingest({ body: fixture });
    expect(result.status).toBe("processed");
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(spotlight.getQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
    expect(spotlight.getRawPayload(result.envelopeId)).toEqual({
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
    const result = await spotlight.ingest({
      body: new Uint8Array(compress(fixture)),
      contentType: " Application/X-Sentry-Envelope ; charset=utf-8 ",
      encoding,
    });
    expect(result.status).toBe("processed");
    expect(spotlight.getQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(spotlight.getRawPayload(result.envelopeId)?.body).toEqual(fixture);
  });

  test("accepts serialized envelope strings", async () => {
    const spotlight = createPipeline();
    expect((await spotlight.ingest({ body: fixture.toString("utf8") })).status).toBe("processed");
  });

  test("returns an explicit ignored result for unsupported content types", async () => {
    const spotlight = createPipeline();
    expect(await spotlight.ingest({ body: fixture, contentType: "application/json" })).toMatchObject({
      status: "ignored",
      reason: expect.any(String),
    });
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("retains raw payloads for valid envelopes containing only unsupported items", async () => {
    const spotlight = createPipeline();
    const body = Buffer.from('{}\n{"type":"attachment","length":5}\nhello');
    const result = await spotlight.ingest({ body });
    expect(result).toMatchObject({ status: "ignored", reason: "unsupported_items", envelopeId: expect.any(String) });
    if (result.status !== "ignored" || !result.envelopeId) throw new Error("Expected retained unsupported envelope");
    expect(spotlight.getEnvelopes()).toHaveLength(1);
    expect(spotlight.getRawPayload(result.envelopeId)?.body).toEqual(body);
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
      const result = await spotlight.ingest(input as Parameters<typeof spotlight.ingest>[0]);
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
    const pending = spotlight.ingest({ body });
    body.fill(0);
    const result = await pending;
    expect(result.status).toBe("processed");
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    const raw = spotlight.getRawPayload(result.envelopeId)!;
    expect(raw.body).toEqual(fixture);
    raw.body.fill(0);
    expect(spotlight.getRawPayload(result.envelopeId)?.body).toEqual(fixture);
  });

  test("bounds raw payload history independently from processed retention", async () => {
    const spotlight = createPipeline({ rawBufferSize: 1 });
    const first = await spotlight.ingest({ body: fixture });
    const second = await spotlight.ingest({ body: fixture });
    if (first.status !== "processed" || second.status !== "processed") throw new Error("Expected envelopes");
    expect(spotlight.getRawPayload(first.envelopeId)).toBeUndefined();
    expect(spotlight.getRawPayload(second.envelopeId)?.body).toEqual(fixture);
    expect(spotlight.getEnvelopes()).toHaveLength(2);
    spotlight.reset();
    expect(spotlight.getRawPayload(second.envelopeId)).toBeUndefined();
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("invalid ingestion cannot evict a retained raw payload", async () => {
    const spotlight = createPipeline({ rawBufferSize: 1 });
    const first = await spotlight.ingest({ body: fixture });
    if (first.status !== "processed") throw new Error("Expected processed envelope");
    expect((await spotlight.ingest({ body: "not an envelope" })).status).toBe("invalid");
    expect((await spotlight.ingest({ body: "{}\n{}\n{}" })).status).toBe("invalid");
    expect(spotlight.getRawPayload(first.envelopeId)?.body).toEqual(fixture);
    expect(spotlight).not.toHaveProperty("buffer");
    expect(spotlight).not.toHaveProperty("store");
  });

  test("retains at most 500 raw payloads by default", async () => {
    const spotlight = createPipeline({ retention: { maxEnvelopes: 1 } });
    const first = await spotlight.ingest({ body: fixture });
    let last = first;
    for (let i = 0; i < 500; i++) last = await spotlight.ingest({ body: fixture });
    if (first.status !== "processed" || last.status !== "processed") throw new Error("Expected envelopes");
    expect(spotlight.getRawPayload(first.envelopeId)).toBeUndefined();
    expect(spotlight.getRawPayload(last.envelopeId)?.body).toEqual(fixture);
    expect(spotlight.getEnvelopes()).toHaveLength(1);
  });

  test("zero raw buffer capacity still processes telemetry", async () => {
    const spotlight = createPipeline({ rawBufferSize: 0 });
    const result = await spotlight.ingest({ body: fixture });
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(spotlight.getRawPayload(result.envelopeId)).toBeUndefined();
    expect(spotlight.getQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
  });

  test("processed age retention does not expire the separate raw history", async () => {
    vi.useFakeTimers();
    const spotlight = createPipeline({ retention: { maxAgeMs: 100 } });
    try {
      const result = await spotlight.ingest({ body: fixture });
      if (result.status !== "processed") throw new Error("Expected processed envelope");
      await vi.advanceTimersByTimeAsync(101);
      expect(spotlight.getEnvelopes()).toEqual([]);
      expect(spotlight.getRawPayload(result.envelopeId)?.body).toEqual(fixture);
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
    const pending = spotlight.ingest({
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
    if ("envelopeId" in result && result.envelopeId) expect(spotlight.getRawPayload(result.envelopeId)).toBeUndefined();
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("delivers invalid-input diagnostics to the configured observer", async () => {
    const diagnostics: string[] = [];
    const spotlight = createPipeline({
      onDiagnostic: diagnostic => {
        diagnostics.push(diagnostic.code);
      },
    });
    const result = await spotlight.ingest({ body: fixture, encoding: "zstd" });
    expect(result.status).toBe("invalid");
    expect(diagnostics).toEqual(["unsupported_encoding"]);
  });

  test("throwing diagnostic observers do not reject invalid input", async () => {
    const spotlight = createPipeline({
      onDiagnostic: () => {
        throw new Error("observer failed");
      },
    });
    expect((await spotlight.ingest({ body: fixture, encoding: "zstd" })).status).toBe("invalid");
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
    const result = await spotlight.ingest({ body: fixture });
    expect(reset).toBe(true);
    if ("envelopeId" in result && result.envelopeId) expect(spotlight.getRawPayload(result.envelopeId)).toBeUndefined();
    expect(spotlight.getEnvelopes()).toEqual([]);
  });

  test("dispose clears raw payloads and prevents subsequent ingestion", async () => {
    const spotlight = createPipeline();
    const result = await spotlight.ingest({ body: fixture });
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    spotlight.dispose();
    expect(spotlight.getRawPayload(result.envelopeId)).toBeUndefined();
    expect((await spotlight.ingest({ body: fixture })).status).toBe("ignored");
    expect(spotlight.getEnvelopes()).toEqual([]);
  });
});
