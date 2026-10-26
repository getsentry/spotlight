import { describe, expect, it } from "vitest";
import type { SentryProcessedProfile, Span } from "../types.ts";
import { getQuerySummaries } from "./database.ts";
import { getProfileFunctionSummaries } from "./profiles.ts";
import { getResourceSummaries } from "./resources.ts";

function span(overrides: Partial<Span> = {}): Span {
  return {
    span_id: "span-id",
    trace_id: "trace-a",
    op: "db.sql.query",
    description: " SELECT 1 ",
    start_timestamp: 1000,
    timestamp: 1010,
    ...overrides,
  };
}

function profile(): SentryProcessedProfile {
  return {
    frames: [
      { function: "main", module: "app" },
      { function: "query", module: "app" },
      { function: "final", module: "app" },
    ],
    stacks: [[0, 1], [0], [2]],
    samples: [
      { start_timestamp: 1000, stack_id: 0, thread_id: "main" },
      { start_timestamp: 1010, stack_id: 1, thread_id: "main" },
      { start_timestamp: 1040, stack_id: 2, thread_id: "main" },
    ],
  };
}

describe("domain summaries", () => {
  it("groups database spans using normalized millisecond fields and excludes invalid inputs", () => {
    const first = span();
    const second = span({ span_id: "second", description: "SELECT 1", timestamp: 1030 });
    const result = getQuerySummaries([
      first,
      span({ op: "http.client" }),
      second,
      span({ description: "   " }),
      span({ timestamp: Number.NaN }),
      span({ start_timestamp: Number.POSITIVE_INFINITY }),
    ]);

    expect(result).toEqual([
      {
        description: "SELECT 1",
        count: 2,
        totalDurationMs: 40,
        averageDurationMs: 20,
        spans: [first, second],
      },
    ]);
    expect(first.description).toBe(" SELECT 1 ");
    expect(getQuerySummaries([first], { description: " SELECT 1 " })).toHaveLength(1);
    expect(getQuerySummaries([first], { description: "SELECT 2" })).toEqual([]);
    expect(getQuerySummaries([first], { traceId: "trace-b" })).toEqual([]);
  });

  it("reports resource size in bytes and retains member spans once", () => {
    const first = span({ op: "resource.script", data: { "http.response_content_length": 400 } });
    const second = span({ op: "resource.script", timestamp: 1030 });
    const third = span({ op: "resource.script", data: { "http.response_content_length": "unknown" } });
    expect(getResourceSummaries([first, second, third, span()])).toEqual([
      {
        description: "SELECT 1",
        count: 3,
        totalDurationMs: 50,
        averageDurationMs: 50 / 3,
        averageEncodedSizeBytes: 400 / 3,
        spans: [first, second, third],
      },
    ]);
  });

  it("aggregates inclusive profile frame intervals across traces and excludes the unbounded final sample", () => {
    const profiles = new Map([
      ["trace-a", profile()],
      ["trace-b", profile()],
    ]);
    expect(getProfileFunctionSummaries(profiles)).toEqual([
      { name: "app@main", totalDurationMs: 80, sampleCount: 4, traceIds: new Set(["trace-a", "trace-b"]) },
      { name: "app@query", totalDurationMs: 20, sampleCount: 2, traceIds: new Set(["trace-a", "trace-b"]) },
    ]);
    expect(getProfileFunctionSummaries(profiles, { traceId: "trace-a" })).toEqual([
      { name: "app@main", totalDurationMs: 40, sampleCount: 2, traceIds: new Set(["trace-a"]) },
      { name: "app@query", totalDurationMs: 10, sampleCount: 1, traceIds: new Set(["trace-a"]) },
    ]);
    expect(getProfileFunctionSummaries(profiles, { traceId: "missing" })).toEqual([]);
    expect(getProfileFunctionSummaries(new Map([["empty", { ...profile(), samples: [] }]]))).toEqual([]);
    expect(profiles.get("trace-a")?.samples).toHaveLength(3);
  });
});
