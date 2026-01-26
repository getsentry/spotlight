"use client";

import { SpanResizer } from "@/registry/spotlight/components/span-resizer";
import { SpanTree } from "@/registry/spotlight/components/span-tree";
import { formatDuration, getDurationClassName } from "@/registry/spotlight/lib/duration";
import type { SpanData, SpanItemProps } from "@/registry/spotlight/lib/types";
import { cn } from "@/registry/spotlight/lib/utils";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

/**
 * SpanItem renders a single span row in the waterfall visualization.
 * It displays the span name, operation, and a timing bar showing duration
 * relative to the total trace duration.
 *
 * Features:
 * - Collapsible children with expand/collapse button
 * - Resizable split between name and waterfall columns
 * - Highlight support for search results
 * - Click selection with callback
 *
 * @example
 * <SpanItem
 *   span={spanData}
 *   startTimestamp={traceStart}
 *   totalDuration={traceDuration}
 *   selectedSpanId={selectedId}
 *   onSpanSelect={(id, span) => setSelectedSpan(span)}
 *   spanNodeWidth={50}
 *   onNodeWidthChange={setNodeWidth}
 * />
 */
export function SpanItem({
  span,
  startTimestamp,
  totalDuration,
  depth = 1,
  selectedSpanId,
  highlightedSpanIds,
  onSpanSelect,
  spanNodeWidth,
  onNodeWidthChange,
}: SpanItemProps) {
  const containerRef = useRef<HTMLLIElement>(null);
  const childrenCount = span.children?.length ?? 0;

  // Auto-collapse based on depth or child count
  const [isCollapsed, setIsCollapsed] = useState(depth >= 10 || childrenCount > 10);
  const [isResizing, setIsResizing] = useState(false);

  const spanDuration = span.timestamp - span.start_timestamp;
  const isSelected = selectedSpanId === span.span_id;
  const isHighlighted = highlightedSpanIds?.has(span.span_id);
  const hasError = span.status && span.status !== "ok";

  const handleResize = (e: MouseEvent) => {
    if (containerRef.current && onNodeWidthChange) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp width between 20% and 80%
      onNodeWidthChange(Math.min(Math.max(newWidth, 20), 80));
    }
  };

  const handleClick = () => {
    onSpanSelect?.(span.span_id, span);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <li ref={containerRef}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "group flex rounded-sm text-sm cursor-pointer",
          "hover:bg-muted/50",
          isHighlighted && "bg-primary/10",
          isSelected && "bg-muted",
          hasError && "text-destructive",
        )}
        style={{ pointerEvents: isResizing ? "none" : "auto" }}
      >
        {/* Span name column */}
        <div
          className={cn(
            "node rounded-sm flex items-center gap-1 overflow-hidden",
            "group-hover:bg-muted/50",
            isSelected ? "bg-muted" : "bg-background",
          )}
          style={{ width: `${spanNodeWidth}%`, paddingRight: "30px" }}
        >
          {/* Collapse/expand button for spans with children */}
          {childrenCount > 0 && (
            <button
              type="button"
              className={cn(
                "z-10 mr-1 flex items-center gap-1 rounded-lg px-1",
                "text-xs font-bold bg-muted text-muted-foreground",
                "hover:bg-muted/80",
              )}
              onClick={e => {
                e.stopPropagation();
                setIsCollapsed(prev => !prev);
              }}
            >
              {childrenCount}
              <ChevronDown className={cn("h-3 w-3 transition-transform", isCollapsed ? "rotate-0" : "rotate-180")} />
            </button>
          )}

          {/* Operation name */}
          {span.op && (
            <>
              <span className="font-bold whitespace-nowrap">{span.op}</span>
              <span className="text-muted-foreground">–</span>
            </>
          )}

          {/* Span description or ID */}
          <span className="truncate" title={span.description || span.span_id}>
            {span.description || span.span_id}
          </span>
        </div>

        {/* Waterfall column */}
        <div className={cn("waterfall relative flex-1 overflow-hidden rounded-sm", "group-hover:bg-muted/50")}>
          <SpanResizer isResizing={isResizing} setIsResizing={setIsResizing} handleResize={handleResize} />

          {/* Timing bar */}
          <div
            className="absolute bg-primary/20 h-full flex items-center px-1"
            style={{
              left: `calc(${Math.min(((span.start_timestamp - startTimestamp) / totalDuration) * 100, 95)}% + 4px)`,
              width: `max(2px, ${(spanDuration / totalDuration) * 95}%)`,
            }}
          >
            <span className={cn("whitespace-nowrap text-xs", getDurationClassName(spanDuration))}>
              {formatDuration(spanDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Render children recursively */}
      {!isCollapsed && childrenCount > 0 && (
        <SpanTree
          spans={span.children!}
          traceStartTimestamp={startTimestamp}
          traceDuration={totalDuration}
          selectedSpanId={selectedSpanId}
          highlightedSpanIds={highlightedSpanIds}
          onSpanSelect={onSpanSelect}
          initialNodeWidth={spanNodeWidth}
        />
      )}
    </li>
  );
}

export default SpanItem;
