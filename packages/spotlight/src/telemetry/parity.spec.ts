// @vitest-environment node
import { readFileSync } from "node:fs";
import type { Envelope } from "@sentry/core";
import { expect, test } from "vitest";
import { createIngester } from "../sdk/core.ts";
import { createPipeline } from "../sdk/node.ts";
import useSentryStore from "../ui/telemetry/store/store";
import { getAITraces, getQuerySummaries, getSpans } from "./selectors/index.ts";

test("the UI store, browser processor, and Node SDK derive identical traces and queries", async () => {
  const spotlight = createPipeline();
  const browser = createIngester();
  const result = await spotlight.ingest({
    body: readFileSync(new URL("../../_fixtures/envelope_span_v2.txt", import.meta.url)),
    contentType: "application/x-sentry-envelope",
  });
  if (result.status !== "processed") throw new Error("Expected processed envelope");
  const envelope = spotlight.getEnvelope(result.envelopeId)!;
  const original = JSON.stringify(envelope);
  useSentryStore.getState().resetData();
  await useSentryStore.getState().ingestEnvelope(envelope);
  await browser.ingestEnvelope(envelope);
  const uiTraces = useSentryStore.getState().getTraces();
  expect(uiTraces).toEqual(spotlight.getTraces());
  expect(browser.getTraces()).toEqual(spotlight.getTraces());
  expect(getQuerySummaries(getSpans(uiTraces))).toEqual(spotlight.getQuerySummaries());
  expect(browser.getQuerySummaries()).toEqual(spotlight.getQuerySummaries());
  expect(JSON.stringify(envelope)).toBe(original);
  useSentryStore.getState().resetData();
});

test("the UI, browser processor, and Node SDK share log, profile, and AI processing", async () => {
  const spotlight = createPipeline();
  const browser = createIngester();
  useSentryStore.getState().resetData();
  for (const file of ["continuous_profiling/transaction.txt", "continuous_profiling/profile_chunk_1.txt"]) {
    const result = await spotlight.ingest({
      body: readFileSync(new URL(`../../_fixtures/${file}`, import.meta.url)),
      contentType: "application/x-sentry-envelope",
    });
    if (result.status !== "processed") throw new Error("Expected processed envelope");
    const input = spotlight.getEnvelope(result.envelopeId)!;
    await browser.ingestEnvelope(input);
    await useSentryStore.getState().ingestEnvelope(input);
  }
  const traceId = "f1e2d3c4b5a6978012345678901234ab";
  const input = [
    { sdk: { name: "sentry.javascript.node", version: "11.9.0" } },
    [
      [{ type: "log" }, { items: [{ id: "log-1", body: "hello", timestamp: 1, trace_id: traceId, attributes: {} }] }],
      [
        { type: "span" },
        {
          version: 2,
          items: [
            {
              trace_id: "ai-trace",
              span_id: "ai",
              name: "chat",
              start_timestamp: 1,
              end_timestamp: 2,
              attributes: { "sentry.op": { value: "gen_ai.chat" }, "gen_ai.request.model": { value: "model" } },
            },
          ],
        },
      ],
    ],
  ] as unknown as Envelope;
  await spotlight.ingestEnvelope(input);
  await browser.ingestEnvelope(input);
  await useSentryStore.getState().ingestEnvelope(input);
  const ui = useSentryStore.getState();
  expect(ui.getLogsByTraceId(traceId)).toEqual(spotlight.getLogs({ traceId }));
  expect(browser.getLogs()).toEqual(spotlight.getLogs());
  expect(ui.getProfileByTraceId(traceId)).toEqual(spotlight.getProfile(traceId));
  expect(browser.getProfile(traceId)).toEqual(spotlight.getProfile(traceId));
  expect(ui.getAggregateCallData()).toEqual(
    spotlight.getProfileFunctionSummaries().map(summary => ({
      name: summary.name,
      totalTime: summary.totalDurationMs,
      samples: summary.sampleCount,
      traceIds: summary.traceIds,
    })),
  );
  expect(getAITraces(ui.getTraces())).toEqual(spotlight.getAITraces());
  expect(browser.getAITraces()).toEqual(spotlight.getAITraces());
  useSentryStore.getState().resetData();
});
