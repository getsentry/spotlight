import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
// @vitest-environment node
import type { Envelope } from "@sentry/core";
import { describe, expect, test } from "vitest";
import { createTelemetryPipeline } from "../sdk/node.ts";
import * as sdk from "./sdk.ts";

const traceId = "a9eab6940aba4ae7bf2f8ac5a54c6a2f";
const rootId = "971f7be43c3ad277";
const queryId = "832028f3635102b6";
const fixture = readFileSync(new URL("../../_fixtures/envelope_span_v2.txt", import.meta.url));
const contentType = "application/x-sentry-envelope";

function envelope(type: string, payload: unknown, id = "test-envelope"): Envelope {
  return [
    { sdk: { name: "sentry.javascript.node", version: "11.9.0" }, __spotlight_envelope_id: id },
    [[{ type }, payload]],
  ] as unknown as Envelope;
}

function span(overrides: Record<string, unknown> = {}) {
  return {
    trace_id: traceId,
    span_id: queryId,
    parent_span_id: rootId,
    name: " SELECT 1 ",
    start_timestamp: 1793000000.125,
    end_timestamp: 1793000000.25,
    attributes: { "sentry.op": { type: "string", value: "db" } },
    ...overrides,
  };
}

describe("shared Telemetry SDK", () => {
  test("ingests compressed v2 spans into traces and query summaries without a browser", async () => {
    const spotlight = createTelemetryPipeline();
    const result = await spotlight.ingestPayload({ body: gzipSync(fixture), encoding: "gzip", contentType });
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    expect(spotlight.getDatabaseQuerySummaries()).toMatchObject([
      {
        count: 1,
        totalDurationMs: 125,
        averageDurationMs: 125,
        description: 'SELECT "public"."Customer"."id" FROM "public"."Customer"',
      },
    ]);
    expect(spotlight.getTraces()).toHaveLength(1);
    expect(spotlight.getTrace(traceId)?.spanTree[0].children?.[0].span_id).toBe(queryId);
    expect(spotlight.getSpans({ traceId })).toHaveLength(2);
    expect(spotlight.getEnvelope(result.envelopeId)?.[1][0][1]).toMatchObject({ version: 2, items: [{}, {}] });
    expect(spotlight.getDecodedPayload(result.envelopeId)?.body).toEqual(fixture);
    expect(spotlight.getEvents()[0]).toMatchObject({
      timestamp: 1793000000250,
      span: { timestamp: 1793000000250, start_timestamp: 1793000000125 },
    });
  });

  test("does not modify parsed envelopes or multiply their timestamps when reused", async () => {
    const input = envelope("transaction", {
      type: "transaction",
      event_id: "txn",
      transaction: "request",
      timestamp: 1793000001,
      start_timestamp: 1793000000,
      contexts: { trace: { trace_id: traceId, span_id: rootId } },
      spans: [
        {
          trace_id: traceId,
          span_id: queryId,
          parent_span_id: rootId,
          op: "db.query",
          description: "SELECT 1",
          start_timestamp: 1793000000.125,
          timestamp: 1793000000.25,
        },
      ],
    });
    const before = JSON.stringify(input);
    const first = createTelemetryPipeline();
    const second = createTelemetryPipeline();
    await first.ingestEnvelope(input);
    await second.ingestEnvelope(input);
    await first.ingestEnvelope(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(first.getDatabaseQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
    expect(second.getDatabaseQuerySummaries()).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
  });

  test("keeps child spans when parents arrive later and deduplicates repeated delivery", async () => {
    const spotlight = createTelemetryPipeline();
    await spotlight.ingestEnvelope(envelope("span", { version: 2, items: [span()] }));
    await spotlight.ingestEnvelope(
      envelope(
        "span",
        {
          version: 2,
          items: [
            span({ span_id: rootId, parent_span_id: undefined, name: "request", is_segment: true, attributes: {} }),
          ],
        },
        "parent",
      ),
    );
    await spotlight.ingestEnvelope(envelope("span", { version: 2, items: [span()] }, "redelivery"));
    expect(spotlight.getDatabaseQuerySummaries()).toMatchObject([
      { count: 1, description: "SELECT 1", averageDurationMs: 125 },
    ]);
    expect(spotlight.getTrace(traceId)?.spanTree[0].children?.map(s => s.span_id)).toEqual([queryId]);
    expect(spotlight.getTrace(traceId)?.transactions).toHaveLength(1);
  });

  test("can scope queries to a trace without merging spans that share an ID", async () => {
    const spotlight = createTelemetryPipeline();
    await spotlight.ingestEnvelope(
      envelope("span", { version: 2, items: [span(), span({ trace_id: "other-trace" })] }),
    );
    expect(spotlight.getDatabaseQuerySummaries()).toMatchObject([{ count: 2, totalDurationMs: 250 }]);
    expect(spotlight.getDatabaseQuerySummaries({ traceId })).toMatchObject([{ count: 1, totalDurationMs: 125 }]);
    expect(spotlight.getSpans({ traceId: "absent" })).toEqual([]);
  });

  test.each([true, false])(
    "merges a legacy transaction and streamed segment for the same span (legacy first: %s)",
    async legacyFirst => {
      const spotlight = createTelemetryPipeline();
      const legacy = envelope(
        "transaction",
        {
          event_id: "legacy",
          transaction: "request",
          start_timestamp: 1793000000,
          timestamp: 1793000001,
          contexts: { trace: { trace_id: traceId, span_id: rootId, op: "http.server", data: { legacy: true } } },
          spans: [
            {
              trace_id: traceId,
              span_id: "legacy-query",
              parent_span_id: rootId,
              op: "db.query",
              description: "SELECT 1",
              start_timestamp: 1793000000.5,
              timestamp: 1793000000.525,
            },
          ],
        },
        "legacy",
      );
      const streamed = envelope(
        "span",
        {
          version: 2,
          items: [
            span({ name: "SELECT 1" }),
            span({
              span_id: rootId,
              parent_span_id: undefined,
              is_segment: true,
              name: "request",
              start_timestamp: 1793000000,
              end_timestamp: 1793000001,
              attributes: { streamed: { value: "yes" } },
            }),
          ],
        },
        "streamed",
      );
      for (const input of legacyFirst ? [legacy, streamed] : [streamed, legacy]) await spotlight.ingestEnvelope(input);
      const trace = spotlight.getTrace(traceId)!;
      expect(trace.transactions).toHaveLength(1);
      expect(trace.rootTransactionName).toBe("request");
      expect(trace.spans.get(rootId)?.op).toBe("http.server");
      expect(trace.spans.get(rootId)?.data).toMatchObject({ legacy: true, streamed: "yes" });
      expect(spotlight.getDatabaseQuerySummaries()).toMatchObject([{ count: 2, totalDurationMs: 150 }]);
    },
  );

  test("isolates instance state and resets buffer and processed data together", async () => {
    const first = createTelemetryPipeline();
    const second = createTelemetryPipeline();
    const ingested = await first.ingestPayload({ body: fixture, contentType });
    expect(second.getTraces()).toEqual([]);
    expect(second.getSdks()).toEqual([]);
    first.reset();
    expect(first.getTraces()).toEqual([]);
    expect(first.getDatabaseQuerySummaries()).toEqual([]);
    expect(first.getEnvelopes()).toEqual([]);
    if (ingested.status === "processed") expect(first.getDecodedPayload(ingested.envelopeId)).toBeUndefined();
  });

  test("awaits optional stacktrace enrichment before exposing errors and trace correlation", async () => {
    const spotlight = createTelemetryPipeline({
      enrichStacktrace: async event => {
        await Promise.resolve();
        event.exception!.values![0].stacktrace!.frames[0].context_line = "throw new Error()";
      },
    });
    const input = envelope("event", {
      event_id: "error",
      type: "event",
      timestamp: 1793000000.5,
      exception: { values: [{ type: "Error", value: "broken", stacktrace: { frames: [{ filename: "app.ts" }] } }] },
      contexts: { trace: { trace_id: traceId, span_id: rootId } },
    });
    await spotlight.ingestEnvelope(input);
    expect(spotlight.getErrors()).toHaveLength(1);
    expect(spotlight.getErrors()[0].exception?.values?.[0].stacktrace?.frames[0].context_line).toBe(
      "throw new Error()",
    );
    expect(spotlight.getTrace(traceId)?.errors).toBe(1);
    expect(JSON.stringify(input)).not.toContain("throw new Error()");
  });

  test("reset prevents a pending error enrichment from restoring cleared data", async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const spotlight = createTelemetryPipeline({ enrichStacktrace: () => gate });
    const pending = spotlight.ingestEnvelope(
      envelope("event", {
        event_id: "error",
        type: "event",
        timestamp: 1,
        exception: { values: [{ type: "Error", value: "old" }] },
        contexts: { trace: { trace_id: traceId, span_id: rootId } },
      }),
    );
    spotlight.reset();
    release();
    await pending;
    expect(spotlight.getEvents()).toEqual([]);
    expect(spotlight.getTraces()).toEqual([]);
  });

  test.each(["sdks", "logs", "events"] as const)(
    "reset from a %s subscriber cancels the current ingestion",
    async key => {
      const spotlight = createTelemetryPipeline();
      let reset = false;
      spotlight.subscribe(state => {
        if (!reset && state[key].length > 0) {
          reset = true;
          spotlight.reset();
        }
      });
      const input =
        key === "logs"
          ? envelope("log", { items: [{ body: "hello", timestamp: 1, attributes: {} }] })
          : envelope("transaction", {
              event_id: "transaction",
              timestamp: 2,
              start_timestamp: 1,
              contexts: { trace: { trace_id: traceId, span_id: rootId } },
            });
      await spotlight.ingestEnvelope(input);
      expect(reset).toBe(true);
      expect(spotlight.getEvents()).toEqual([]);
      expect(spotlight.getTraces()).toEqual([]);
      expect(spotlight.getLogs()).toEqual([]);
      expect(spotlight.getSdks()).toEqual([]);
      expect(spotlight.getEnvelopes()).toEqual([]);
    },
  );

  test("normalizes logs and correlates them to traces", async () => {
    const spotlight = createTelemetryPipeline();
    await spotlight.ingestEnvelope(
      envelope("log", {
        type: "log",
        items: [{ timestamp: 1793000000, body: "hello", level: "info", trace_id: traceId, attributes: {} }],
      }),
    );
    expect(spotlight.getLogs({ traceId })).toMatchObject([{ body: "hello", timestamp: 1793000000000 }]);
  });

  test("redelivery of the same idless parsed envelope does not duplicate logs", async () => {
    const spotlight = createTelemetryPipeline();
    const input = [
      {},
      [[{ type: "log" }, { items: [{ timestamp: 1, body: "hello", level: "info", attributes: {} }] }]],
    ] as unknown as Envelope;
    const before = JSON.stringify(input);
    await spotlight.ingestEnvelope(input);
    await spotlight.ingestEnvelope(input);
    expect(spotlight.getLogs()).toHaveLength(1);
    expect(spotlight.getEnvelopes()).toHaveLength(1);
    expect(JSON.stringify(input)).toBe(before);
    spotlight.reset();
    await spotlight.ingestEnvelope(input);
    expect(spotlight.getLogs()).toHaveLength(1);
  });

  test("notifies subscribers with completed state and supports unsubscribing", async () => {
    const spotlight = createTelemetryPipeline();
    const observed: number[] = [];
    const unsubscribe = spotlight.subscribe(() => observed.push(spotlight.getDatabaseQuerySummaries().length));
    await spotlight.ingestPayload({ body: fixture, contentType });
    expect(observed.at(-1)).toBe(1);
    unsubscribe();
    const count = observed.length;
    spotlight.reset();
    expect(observed).toHaveLength(count);
  });

  test("keeps the existing raw buffer SDK usable independently", () => {
    const buffer = sdk.createSpotlightBuffer(10);
    const container = sdk.pushToSpotlightBuffer({ spotlightBuffer: buffer, body: fixture, contentType });
    expect(container?.getEventTypes()).toEqual(["span"]);
  });

  test("concurrent ingestion of the same envelope waits for its pending processing", async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const spotlight = createTelemetryPipeline({ enrichStacktrace: () => gate });
    const input = envelope("event", { event_id: "pending", type: "event", timestamp: 1, exception: { values: [] } });
    const first = spotlight.ingestEnvelope(input);
    let secondFinished = false;
    const second = spotlight.ingestEnvelope(input).then(() => {
      secondFinished = true;
    });
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(secondFinished).toBe(false);
    release();
    await Promise.all([first, second]);
    expect(spotlight.getErrors()).toHaveLength(1);
  });

  test("an unavailable enrichment adapter does not discard a captured error", async () => {
    const spotlight = createTelemetryPipeline({
      enrichStacktrace: async () => {
        throw new Error("offline");
      },
    });
    await spotlight.ingestEnvelope(
      envelope("event", { event_id: "error", type: "event", timestamp: 1, exception: { values: [] } }),
    );
    expect(spotlight.getErrors()).toHaveLength(1);
  });

  test("shares resource summaries, AI extraction, and web-vitals scoring", async () => {
    const spotlight = createTelemetryPipeline();
    await spotlight.ingestEnvelope(
      envelope("span", {
        version: 2,
        items: [
          span({
            span_id: "resource",
            name: "app.js",
            attributes: { "sentry.op": { value: "resource.script" }, "http.response_content_length": { value: 2048 } },
          }),
          span({
            span_id: "ai",
            name: "chat",
            attributes: {
              "sentry.op": { value: "gen_ai.chat" },
              "gen_ai.request.model": { value: "test-model" },
              "gen_ai.usage.input_tokens": { value: 10 },
              "gen_ai.usage.output_tokens": { value: 5 },
            },
          }),
        ],
      }),
    );
    expect(spotlight.getResourceSummaries()).toMatchObject([
      { description: "app.js", count: 1, totalDurationMs: 125, averageEncodedSizeBytes: 2048 },
    ]);
    expect(spotlight.getAITraces()).toMatchObject([
      { id: "ai", durationMs: 125, promptTokens: 10, completionTokens: 5 },
    ]);
    await spotlight.ingestEnvelope(
      envelope(
        "transaction",
        {
          type: "transaction",
          event_id: "page",
          transaction: "/",
          start_timestamp: 1,
          timestamp: 2,
          contexts: { trace: { trace_id: "page-trace", span_id: "page-span", op: "pageload" } },
          measurements: { fcp: { value: 900, unit: "millisecond" } },
        },
        "page",
      ),
    );
    const result = spotlight.getWebVitals();
    expect(result).toHaveLength(1);
    expect(result[0].measurements["score.fcp"].value).toBeCloseTo(0.9, 5);
    expect(result[0].measurements["score.total"].value).toBeCloseTo(0.192857, 5);
    expect(spotlight.getEvent("page")?.measurements).not.toHaveProperty("score.total");
  });

  test.each([true, false])(
    "associates continuous profiles with their trace (profile first: %s)",
    async profileFirst => {
      const spotlight = createTelemetryPipeline();
      const transaction = readFileSync(
        new URL("../../_fixtures/continuous_profiling/transaction.txt", import.meta.url),
      );
      const profile = readFileSync(
        new URL("../../_fixtures/continuous_profiling/profile_chunk_1.txt", import.meta.url),
      );
      for (const body of profileFirst ? [profile, transaction] : [transaction, profile]) {
        await spotlight.ingestPayload({ body, contentType });
      }
      const profileTraceId = "f1e2d3c4b5a6978012345678901234ab";
      expect(spotlight.getProfile(profileTraceId)?.samples.length).toBeGreaterThan(0);
      expect(spotlight.getTrace(profileTraceId)?.profileGrafted).toBe(true);
      expect(spotlight.getProfileFunctionSummaries().length).toBeGreaterThan(0);
    },
  );
});
