"use client";

import { cn } from "@/lib/utils";
import { SpanItem } from "@/registry/new-york/span-tree/span-item";
import type { SpanTreeProps } from "@/registry/new-york/span-tree/types";
import { useState } from "react";

/**
 * SpanTree renders a hierarchical waterfall visualization for distributed trace spans.
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
