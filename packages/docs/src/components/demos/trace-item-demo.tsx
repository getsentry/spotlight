"use client";

import { ComponentPreview } from "@/components/docs/component-preview";
import { TraceItem } from "@/registry/new-york/trace-item/trace-item";
import type { TraceData } from "@/registry/new-york/trace-item/types";
import { useState } from "react";

// Mock trace data
const mockTraces: TraceData[] = [
  {
    trace_id: "abc123def456ghi789",
    start_timestamp: Date.now() - 120000,
    timestamp: Date.now() - 119550,
    status: "ok",
    spans: new Map(),
    spanTree: [],
    rootTransactionName: "/api/users",
    rootTransactionMethod: "GET",
    environment: "production",
  },
  {
    trace_id: "xyz789abc123def456",
    start_timestamp: Date.now() - 300000,
    timestamp: Date.now() - 298200,
    status: "error",
    spans: new Map(),
    spanTree: [],
    rootTransactionName: "/api/orders/checkout",
    rootTransactionMethod: "POST",
    environment: "production",
  },
  {
    trace_id: "qrs456tuv789wxy012",
    start_timestamp: Date.now() - 60000,
    timestamp: Date.now() - 59800,
    status: "ok",
    spans: new Map(),
    spanTree: [],
    rootTransactionName: "/health",
    rootTransactionMethod: "GET",
    environment: "staging",
  },
];

const demoCode = `"use client";

import { TraceItem } from "@/components/ui/trace-item";
import type { TraceData } from "@/components/ui/trace-item/types";
import { useState } from "react";

const traces: TraceData[] = [
  {
    trace_id: "abc123def456",
    start_timestamp: Date.now() - 120000,
    timestamp: Date.now() - 119550,
    status: "ok",
    spans: new Map(),
    spanTree: [],
    rootTransactionName: "/api/users",
    rootTransactionMethod: "GET",
    environment: "production",
  },
];

export function MyComponent() {
  const [selectedId, setSelectedId] = useState<string>();

  return (
    <div className="border rounded-lg overflow-hidden">
      {traces.map((trace) => (
        <TraceItem
          key={trace.trace_id}
          trace={trace}
          isSelected={selectedId === trace.trace_id}
          onSelect={(traceId) => setSelectedId(traceId)}
        />
      ))}
    </div>
  );
}`;

function TraceItemDemoInner() {
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>();

  return (
    <div className="w-full border rounded-lg overflow-hidden">
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

/** Standalone demo component for use in MDX */
export function TraceItemDemo() {
  return (
    <ComponentPreview code={demoCode}>
      <TraceItemDemoInner />
    </ComponentPreview>
  );
}

export default TraceItemDemo;
