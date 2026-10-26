import type { Envelope } from "@sentry/core";
import { processEnvelope } from "@spotlight/server/parser/processEnvelope";
import { beforeEach, describe, expect, test } from "vitest";
import { DB_SPAN_REGEX } from "../../constants";
import type { Span } from "../../types";
import useSentryStore from "../store";

const traceId = "b99011b43059c992d5dab0b8281f519b";
const rootId = "b4fce4cd9b181309";
const queryId = "96f1f17b0e339de4";
const query = 'SELECT "public"."Customer"."id" FROM "public"."Customer"';

function streamedSpan(overrides: Record<string, unknown> = {}) {
  return {
    trace_id: traceId,
    span_id: queryId,
    parent_span_id: rootId,
    name: query,
    start_timestamp: 1793000000.125,
    end_timestamp: 1793000000.25,
    status: "ok",
    is_segment: false,
    attributes: {
      "sentry.op": { type: "string", value: "db" },
      "db.system.name": { type: "string", value: "postgresql" },
      "db.query.text": { type: "string", value: query },
      "db.response.returned_rows": { type: "integer", value: 3 },
      "db.query.cached": { type: "boolean", value: false },
    },
    ...overrides,
  };
}

function segment(overrides: Record<string, unknown> = {}) {
  return streamedSpan({
    span_id: rootId,
    parent_span_id: undefined,
    name: "GET /applications/[applicationId]/subscriptions",
    start_timestamp: 1793000000,
    end_timestamp: 1793000001,
    is_segment: true,
    attributes: { "sentry.op": { type: "string", value: "http.server" } },
    ...overrides,
  });
}

async function ingest(type: string, payload: unknown, contentType?: string): Promise<Envelope> {
  const parsed = processEnvelope({
    contentType: "application/x-sentry-envelope",
    data: [
      JSON.stringify({ sent_at: "2026-10-26T00:00:00Z", sdk: { name: "sentry.javascript.nextjs", version: "11.6.0" } }),
      JSON.stringify({ type, ...(contentType && { content_type: contentType }) }),
      JSON.stringify(payload),
    ].join("\n"),
  });
  expect(parsed).not.toBeNull();
  await useSentryStore.getState().pushEnvelope(parsed!.envelope);
  return parsed!.envelope;
}

async function ingestSpans(items: unknown[]) {
  return ingest("span", { version: 2, items }, "application/vnd.sentry.items.span.v2+json");
}

function getTrace() {
  return useSentryStore.getState().getTraceById(traceId)!;
}

function getQueries() {
  return [...getTrace().spans.values()].filter(span => DB_SPAN_REGEX.test(span.op || ""));
}

function treeIds(spans: Span[]): string[] {
  return spans.flatMap(span => [span.span_id, ...treeIds(span.children || [])]);
}

function legacyTransaction() {
  return {
    type: "transaction",
    event_id: "legacy-transaction",
    transaction: "legacy request",
    start_timestamp: 1793000000,
    timestamp: 1793000001,
    contexts: { trace: { trace_id: traceId, span_id: rootId, op: "http.server" } },
    spans: [
      {
        trace_id: traceId,
        span_id: "aaaaaaaaaaaaaaaa",
        parent_span_id: rootId,
        description: "SELECT 1",
        op: "db.query",
        start_timestamp: 1793000000.5,
        timestamp: 1793000000.75,
      },
    ],
  };
}

describe("standalone span envelope ingestion", () => {
  beforeEach(() => useSentryStore.getState().resetData());

  test("v2 database spans populate Queries with names, typed attributes and millisecond timing", async () => {
    const envelope = await ingestSpans([streamedSpan(), segment()]);

    expect(useSentryStore.getState().getTraces()).toHaveLength(1);
    expect(getQueries()).toHaveLength(1);
    expect(getQueries()[0]).toMatchObject({
      span_id: queryId,
      parent_span_id: rootId,
      description: query,
      op: "db",
      start_timestamp: 1793000000125,
      timestamp: 1793000000250,
      data: { "db.system.name": "postgresql", "db.response.returned_rows": 3, "db.query.cached": false },
    });
    expect(getTrace().rootTransactionName).toBe("GET /applications/[applicationId]/subscriptions");
    expect(getTrace().transactions).toHaveLength(1);
    expect(getTrace().spanTree[0].children?.[0].span_id).toBe(queryId);
    // Keep the raw v2 payload available in the Envelopes view.
    expect(envelope[1][0][1]).toMatchObject({ version: 2, items: [{ name: query }, {}] });
  });

  test("queries are visible before their segment ends and late parents replace orphan placeholders", async () => {
    const parentId = "83aed660f800afd4";
    await ingestSpans([streamedSpan({ parent_span_id: parentId })]);
    expect(getQueries()).toHaveLength(1);

    await ingestSpans([segment()]);
    await ingestSpans([streamedSpan({ span_id: parentId, name: "prisma query", attributes: {} })]);
    await ingestSpans([streamedSpan({ span_id: "bbbbbbbbbbbbbbbb", parent_span_id: parentId })]);

    expect(getQueries()).toHaveLength(2);
    expect(getTrace().transactions).toHaveLength(1);
    expect(getTrace().spanTree[0].span_id).toBe(rootId);
    expect(treeIds(getTrace().spanTree).sort()).toEqual([rootId, parentId, queryId, "bbbbbbbbbbbbbbbb"].sort());
    expect([...getTrace().spans.values()].some(span => span.op === "orphan")).toBe(false);
    expect(getTrace().timestamp - getTrace().start_timestamp).toBe(1000);
  });

  test("repeated delivery does not duplicate query counts or span tree children", async () => {
    await ingestSpans([segment(), streamedSpan()]);
    await ingestSpans([streamedSpan(), segment()]);
    expect(getQueries()).toHaveLength(1);
    expect(treeIds(getTrace().spanTree)).toEqual([rootId, queryId]);
    expect(getTrace().transactions).toHaveLength(1);
  });

  test.each([true, false])("legacy transactions and streamed queries coexist (transaction first: %s)", async first => {
    if (first) await ingest("transaction", legacyTransaction());
    await ingestSpans([streamedSpan()]);
    if (!first) await ingest("transaction", legacyTransaction());

    expect(
      getQueries()
        .map(span => span.description)
        .sort(),
    ).toEqual([query, "SELECT 1"].sort());
    expect(treeIds(getTrace().spanTree).sort()).toEqual([rootId, queryId, "aaaaaaaaaaaaaaaa"].sort());
  });

  test("legacy standalone span items are accepted alongside v2 containers", async () => {
    await ingest("span", {
      trace_id: traceId,
      span_id: queryId,
      parent_span_id: rootId,
      description: query,
      op: "db",
      start_timestamp: 1793000000.125,
      timestamp: 1793000000.25,
      data: { "db.system": "postgresql" },
    });
    await ingestSpans([segment()]);
    expect(getQueries()[0]).toMatchObject({ description: query, data: { "db.system": "postgresql" } });
    expect(treeIds(getTrace().spanTree)).toEqual([rootId, queryId]);
  });

  test("segment spans with remote parents still supply the local trace name", async () => {
    await ingestSpans([streamedSpan(), segment({ parent_span_id: "cccccccccccccccc" })]);
    expect(getTrace().rootTransactionName).toBe("GET /applications/[applicationId]/subscriptions");
    expect(getTrace().rootTransaction?.contexts.trace.span_id).toBe(rootId);
    expect(getQueries()).toHaveLength(1);
  });

  test("unsupported containers and invalid spans do not prevent valid spans from being ingested", async () => {
    await ingest("span", { version: 99, items: [streamedSpan()] });
    expect(useSentryStore.getState().getTraces()).toHaveLength(0);
    await ingestSpans([
      null,
      {},
      streamedSpan({ end_timestamp: undefined }),
      streamedSpan({ trace_id: "" }),
      streamedSpan(),
    ]);
    expect(getQueries()).toHaveLength(1);
    expect(Number.isFinite(getTrace().timestamp)).toBe(true);
  });

  test("span IDs are scoped to their trace", async () => {
    await ingestSpans([streamedSpan(), streamedSpan({ trace_id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" })]);
    expect(useSentryStore.getState().getTraces()).toHaveLength(2);
    expect(getQueries()).toHaveLength(1);
  });

  test("segment attributes survive subsequent segments in the same distributed trace", async () => {
    await ingestSpans([
      segment({
        attributes: {
          "sentry.op": { type: "string", value: "http.server" },
          "http.request.method": { type: "string", value: "GET" },
          "http.response.status_code": { type: "integer", value: 200 },
        },
      }),
    ]);
    await ingestSpans([segment({ span_id: "dddddddddddddddd", parent_span_id: rootId })]);
    expect(getTrace().spans.get(rootId)?.data).toMatchObject({
      "http.request.method": "GET",
      "http.response.status_code": 200,
    });
  });
});
