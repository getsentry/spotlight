"use client";

import { SpanTree } from "@/components/span-tree";
import { ThemeToggle } from "@/components/theme-toggle";
import { TraceItem } from "@/components/trace-item";
import type { SpanData, TraceData } from "@/lib/types";
import { useState } from "react";

// Sample span data with nested children
const sampleSpans: SpanData[] = [
  {
    span_id: "span-root",
    op: "http.server",
    description: "GET /api/users",
    start_timestamp: 0,
    timestamp: 350,
    status: "ok",
    children: [
      {
        span_id: "span-auth",
        op: "auth.verify",
        description: "JWT token verification",
        start_timestamp: 5,
        timestamp: 25,
        status: "ok",
        parent_span_id: "span-root",
      },
      {
        span_id: "span-db",
        op: "db.query",
        description: "SELECT * FROM users WHERE active = true",
        start_timestamp: 30,
        timestamp: 180,
        status: "ok",
        parent_span_id: "span-root",
        children: [
          {
            span_id: "span-db-connect",
            op: "db.connect",
            description: "PostgreSQL connection pool",
            start_timestamp: 30,
            timestamp: 45,
            status: "ok",
            parent_span_id: "span-db",
          },
          {
            span_id: "span-db-execute",
            op: "db.execute",
            description: "Execute query",
            start_timestamp: 45,
            timestamp: 175,
            status: "ok",
            parent_span_id: "span-db",
          },
        ],
      },
      {
        span_id: "span-cache",
        op: "cache.get",
        description: "redis.get(user:preferences:*)",
        start_timestamp: 185,
        timestamp: 195,
        status: "ok",
        parent_span_id: "span-root",
      },
      {
        span_id: "span-serialize",
        op: "serialize",
        description: "JSON response serialization",
        start_timestamp: 200,
        timestamp: 340,
        status: "ok",
        parent_span_id: "span-root",
      },
    ],
  },
];

// Sample error trace spans
const errorSpans: SpanData[] = [
  {
    span_id: "err-root",
    op: "http.server",
    description: "POST /api/orders",
    start_timestamp: 0,
    timestamp: 1200,
    status: "error",
    children: [
      {
        span_id: "err-validate",
        op: "validation",
        description: "Request body validation",
        start_timestamp: 5,
        timestamp: 15,
        status: "ok",
        parent_span_id: "err-root",
      },
      {
        span_id: "err-payment",
        op: "http.client",
        description: "POST https://payments.stripe.com/v1/charges",
        start_timestamp: 20,
        timestamp: 1150,
        status: "error",
        parent_span_id: "err-root",
      },
    ],
  },
];

// Create sample traces
const sampleTraces: TraceData[] = [
  {
    trace_id: "abc123def456ghi789jkl",
    start_timestamp: Date.now() - 30000,
    timestamp: Date.now() - 29650,
    status: "ok",
    spans: new Map(sampleSpans.flatMap(flattenSpans).map(s => [s.span_id, s])),
    spanTree: sampleSpans,
    rootTransactionName: "/api/users",
    rootTransactionMethod: "GET",
    environment: "development",
  },
  {
    trace_id: "xyz789abc123def456mno",
    start_timestamp: Date.now() - 120000,
    timestamp: Date.now() - 118800,
    status: "error",
    spans: new Map(errorSpans.flatMap(flattenSpans).map(s => [s.span_id, s])),
    spanTree: errorSpans,
    rootTransactionName: "/api/orders",
    rootTransactionMethod: "POST",
    environment: "staging",
  },
  {
    trace_id: "pqr456stu789vwx012yz",
    start_timestamp: Date.now() - 300000,
    timestamp: Date.now() - 299800,
    status: "ok",
    spans: new Map(),
    spanTree: [],
    rootTransactionName: "/health",
    rootTransactionMethod: "GET",
    environment: "production",
  },
];

// Helper to flatten spans for the Map
function flattenSpans(span: SpanData): SpanData[] {
  const result = [span];
  if (span.children) {
    for (const child of span.children) {
      result.push(...flattenSpans(child));
    }
  }
  return result;
}

export default function Home() {
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>();
  const [selectedSpanId, setSelectedSpanId] = useState<string | undefined>();

  const selectedTrace = sampleTraces.find(t => t.trace_id === selectedTraceId);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Spotlight Registry Demo</h1>
          <ThemeToggle />
        </div>
        <p className="text-muted-foreground mb-8">Preview of the shadcn-compatible trace visualization components</p>

        {/* Trace List Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">TraceItem Component</h2>
          <p className="text-sm text-muted-foreground mb-4">Click a trace to view its spans in the waterfall below</p>
          <div className="border rounded-lg divide-y">
            {sampleTraces.map(trace => (
              <TraceItem
                key={trace.trace_id}
                trace={trace}
                isSelected={selectedTraceId === trace.trace_id}
                onSelect={id => {
                  setSelectedTraceId(id);
                  setSelectedSpanId(undefined);
                }}
              />
            ))}
          </div>
        </section>

        {/* Span Tree Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">SpanTree Component</h2>
          {selectedTrace ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Waterfall view for trace{" "}
                <code className="bg-muted px-1 rounded">{selectedTrace.trace_id.slice(0, 8)}</code>
                {selectedSpanId && (
                  <>
                    {" "}
                    — Selected span: <code className="bg-muted px-1 rounded">{selectedSpanId}</code>
                  </>
                )}
              </p>
              <div className="border rounded-lg p-4 bg-card">
                {selectedTrace.spanTree.length > 0 ? (
                  <SpanTree
                    spans={selectedTrace.spanTree}
                    traceStartTimestamp={0}
                    traceDuration={selectedTrace.timestamp - selectedTrace.start_timestamp}
                    selectedSpanId={selectedSpanId}
                    onSpanSelect={id => setSelectedSpanId(id)}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">This trace has no spans to display</p>
                )}
              </div>
            </>
          ) : (
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Select a trace above to view its span waterfall
            </div>
          )}
        </section>

        {/* Installation Info */}
        <section className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Installation</h2>
          <p className="text-muted-foreground mb-4">Install these components in your project using the shadcn CLI:</p>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            <p className="text-muted-foreground"># Install SpanTree (includes SpanItem, SpanResizer)</p>
            <p>pnpm dlx shadcn@latest add https://spotlightjs.com/r/span-tree.json</p>
            <p className="text-muted-foreground mt-4"># Install TraceItem (includes TimeSince, TraceBadge)</p>
            <p>pnpm dlx shadcn@latest add https://spotlightjs.com/r/trace-item.json</p>
          </div>
        </section>
      </div>
    </main>
  );
}
