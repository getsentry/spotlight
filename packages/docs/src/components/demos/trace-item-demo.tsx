"use client";

import { TraceItem } from "@/components/ui/trace-item";
import type { SpanData, TraceData } from "@/components/ui/trace-item/types";
import { useState } from "react";

// Helper to create a Map from an array
function createSpanMap(spans: SpanData[]): Map<string, SpanData> {
  const map = new Map<string, SpanData>();
  for (const span of spans) {
    map.set(span.span_id, span);
  }
  return map;
}

// Mock trace data
const mockTraces: TraceData[] = [
  {
    trace_id: "abc123def456",
    start_timestamp: Date.now() - 120000, // 2 minutes ago
    timestamp: Date.now() - 119550,
    status: "ok",
    spans: createSpanMap([
      { span_id: "s1", start_timestamp: 0, timestamp: 100 },
      { span_id: "s2", start_timestamp: 10, timestamp: 80 },
      { span_id: "s3", start_timestamp: 20, timestamp: 90 },
    ]),
    spanTree: [],
    rootTransactionName: "/api/users",
    rootTransactionMethod: "GET",
    environment: "production",
  },
  {
    trace_id: "xyz789ghi012",
    start_timestamp: Date.now() - 300000, // 5 minutes ago
    timestamp: Date.now() - 298500,
    status: "error",
    spans: createSpanMap([
      { span_id: "s4", start_timestamp: 0, timestamp: 500 },
      { span_id: "s5", start_timestamp: 50, timestamp: 400 },
    ]),
    spanTree: [],
    rootTransactionName: "/api/orders/create",
    rootTransactionMethod: "POST",
    environment: "staging",
  },
  {
    trace_id: "mno345pqr678",
    start_timestamp: Date.now() - 600000, // 10 minutes ago
    timestamp: Date.now() - 599800,
    status: "ok",
    spans: createSpanMap([{ span_id: "s6", start_timestamp: 0, timestamp: 50 }]),
    spanTree: [],
    rootTransactionName: "/health",
    rootTransactionMethod: "GET",
    environment: "production",
  },
];

export function TraceItemDemo() {
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>();

  return (
    <div className="w-full max-w-3xl border rounded-lg overflow-hidden">
      {mockTraces.map(trace => (
        <TraceItem
          key={trace.trace_id}
          trace={trace}
          isSelected={selectedTraceId === trace.trace_id}
          onSelect={traceId => setSelectedTraceId(traceId)}
        />
      ))}
    </div>
  );
}

export const traceItemDemoCode = `"use client";

import { TraceItem } from "@/components/ui/trace-item";
import type { TraceData } from "@/components/ui/trace-item/types";
import { useState } from "react";

const trace: TraceData = {
  trace_id: "abc123def456",
  start_timestamp: Date.now() - 120000,
  timestamp: Date.now() - 119550,
  status: "ok",
  spans: new Map(),
  spanTree: [],
  rootTransactionName: "/api/users",
  rootTransactionMethod: "GET",
  environment: "production",
};

export function MyComponent() {
  const [selectedId, setSelectedId] = useState<string>();

  return (
    <TraceItem
      trace={trace}
      isSelected={selectedId === trace.trace_id}
      onSelect={(traceId) => setSelectedId(traceId)}
    />
  );
}`;

export default TraceItemDemo;
