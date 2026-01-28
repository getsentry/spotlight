"use client";

import { ComponentPreview } from "@/components/docs/component-preview";
import { SpanTree } from "@/registry/new-york/span-tree/span-tree";
import type { SpanData } from "@/registry/new-york/span-tree/types";
import { useMemo, useState } from "react";

// Mock span data representing a typical web request
const mockSpans: SpanData[] = [
  {
    span_id: "span-001",
    trace_id: "trace-abc123",
    op: "http.server",
    description: "GET /api/users",
    start_timestamp: 1700000000000,
    timestamp: 1700000000450,
    status: "ok",
    children: [
      {
        span_id: "span-002",
        trace_id: "trace-abc123",
        parent_span_id: "span-001",
        op: "db.query",
        description: "SELECT * FROM users WHERE active = true",
        start_timestamp: 1700000000050,
        timestamp: 1700000000200,
        status: "ok",
        children: [],
      },
      {
        span_id: "span-003",
        trace_id: "trace-abc123",
        parent_span_id: "span-001",
        op: "cache.get",
        description: "Redis GET user:settings",
        start_timestamp: 1700000000210,
        timestamp: 1700000000230,
        status: "ok",
        children: [],
      },
      {
        span_id: "span-004",
        trace_id: "trace-abc123",
        parent_span_id: "span-001",
        op: "http.client",
        description: "POST /internal/analytics",
        start_timestamp: 1700000000240,
        timestamp: 1700000000420,
        status: "ok",
        children: [
          {
            span_id: "span-005",
            trace_id: "trace-abc123",
            parent_span_id: "span-004",
            op: "serialize",
            description: "JSON.stringify(payload)",
            start_timestamp: 1700000000250,
            timestamp: 1700000000260,
            status: "ok",
            children: [],
          },
        ],
      },
    ],
  },
];

const traceStartTimestamp = 1700000000000;
const traceDuration = 450;

// IDs of database and cache spans to highlight
const dbSpanIds = new Set(["span-002", "span-003"]);

const demoCode = `"use client";

import { SpanTree } from "@/components/ui/span-tree";
import type { SpanData } from "@/components/ui/span-tree/types";
import { useState } from "react";

const spans: SpanData[] = [
  {
    span_id: "span-001",
    op: "http.server",
    description: "GET /api/users",
    start_timestamp: 1700000000000,
    timestamp: 1700000000450,
    status: "ok",
    children: [
      {
        span_id: "span-002",
        op: "db.query",
        description: "SELECT * FROM users",
        start_timestamp: 1700000000050,
        timestamp: 1700000000200,
        status: "ok",
      },
    ],
  },
];

export function MyComponent() {
  const [selectedSpanId, setSelectedSpanId] = useState<string>();

  return (
    <SpanTree
      spans={spans}
      traceStartTimestamp={1700000000000}
      traceDuration={450}
      selectedSpanId={selectedSpanId}
      onSpanSelect={(spanId) => setSelectedSpanId(spanId)}
    />
  );
}`;

function SpanTreeDemoInner() {
  const [selectedSpanId, setSelectedSpanId] = useState<string | undefined>();
  const [highlightEnabled, setHighlightEnabled] = useState(false);

  const highlightedSpanIds = useMemo(() => (highlightEnabled ? dbSpanIds : undefined), [highlightEnabled]);

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={highlightEnabled}
            onChange={e => setHighlightEnabled(e.target.checked)}
            className="rounded border-muted-foreground"
          />
          <span>Highlight database spans</span>
        </label>
      </div>

      <SpanTree
        spans={mockSpans}
        traceStartTimestamp={traceStartTimestamp}
        traceDuration={traceDuration}
        selectedSpanId={selectedSpanId}
        highlightedSpanIds={highlightedSpanIds}
        onSpanSelect={spanId => setSelectedSpanId(spanId)}
        className="text-sm"
      />

      {selectedSpanId && (
        <p className="mt-4 text-sm text-muted-foreground">
          Selected span: <code className="bg-muted px-1 py-0.5 rounded">{selectedSpanId}</code>
        </p>
      )}
    </div>
  );
}

/** Standalone demo component for use in MDX */
export function SpanTreeDemo() {
  return (
    <ComponentPreview code={demoCode}>
      <SpanTreeDemoInner />
    </ComponentPreview>
  );
}

export default SpanTreeDemo;
