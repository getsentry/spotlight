"use client";

import { SpanItem } from "@/registry/spotlight/components/span-item";
import type { SpanTreeProps } from "@/registry/spotlight/lib/types";
import { cn } from "@/registry/spotlight/lib/utils";
import { useState } from "react";

/**
 * SpanTree renders a hierarchical waterfall visualization for distributed trace spans.
 *
 * Features:
 * - Hierarchical display of parent-child span relationships
 * - Resizable split between span name and waterfall timing columns
 * - Timing bars showing span duration relative to total trace
 * - Collapsible nodes for deep traces
 * - Optional highlighting for search/filter results
 * - Click selection with callback support
 *
 * @example
 * ```tsx
 * <SpanTree
 *   spans={trace.spanTree}
 *   traceStartTimestamp={trace.start_timestamp}
 *   traceDuration={trace.timestamp - trace.start_timestamp}
 *   selectedSpanId={selectedId}
 *   onSpanSelect={(id, span) => {
 *     console.log("Selected span:", span);
 *     setSelectedId(id);
 *   }}
 * />
 * ```
 *
 * @example With highlighting
 * ```tsx
 * const matchingSpanIds = new Set(
 *   spans.filter(s => s.op?.includes(searchQuery)).map(s => s.span_id)
 * );
 *
 * <SpanTree
 *   spans={trace.spanTree}
 *   traceStartTimestamp={trace.start_timestamp}
 *   traceDuration={traceDuration}
 *   highlightedSpanIds={matchingSpanIds}
 * />
 * ```
 */
export function SpanTree({
  spans,
  traceStartTimestamp,
  traceDuration,
  selectedSpanId,
  onSpanSelect,
  highlightedSpanIds,
  initialNodeWidth = 50,
  className,
}: SpanTreeProps) {
  const [spanNodeWidth, setSpanNodeWidth] = useState(initialNodeWidth);

  if (!spans || spans.length === 0) {
    return null;
  }

  return (
    <ul className={cn("span-tree", spans.length > 1 && "deep", className)}>
      {spans.map(span => (
        <SpanItem
          key={span.span_id}
          span={span}
          startTimestamp={traceStartTimestamp}
          totalDuration={traceDuration}
          depth={1}
          selectedSpanId={selectedSpanId}
          highlightedSpanIds={highlightedSpanIds}
          onSpanSelect={onSpanSelect}
          spanNodeWidth={spanNodeWidth}
          onNodeWidthChange={setSpanNodeWidth}
        />
      ))}
    </ul>
  );
}

export default SpanTree;
