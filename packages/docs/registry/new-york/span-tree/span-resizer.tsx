"use client";

import { cn } from "@/lib/utils";
import type { SpanResizerProps } from "@/registry/new-york/span-tree/types";
import { memo, useCallback, useEffect, useRef, useState } from "react";

/**
 * SpanResizer component provides a draggable handle for resizing
 * the span name column width in the waterfall visualization.
 */
function SpanResizerComponent({ handleResize, isResizing, setIsResizing }: SpanResizerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const lastUpdateRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup event listeners on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const onMouseMove = (e: MouseEvent) => {
        const now = Date.now();
        // Throttle to ~60fps for smooth performance
        if (now - lastUpdateRef.current < 16) return;
        lastUpdateRef.current = now;
        requestAnimationFrame(() => handleResize(e));
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        cleanupRef.current = null;
      };

      // Store cleanup function for unmount scenario
      cleanupRef.current = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [handleResize, setIsResizing],
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <div
      className={cn(
        "absolute left-0 top-0 h-full w-1 cursor-col-resize z-10 transition-colors",
        isResizing || isHovered ? "bg-primary" : "bg-transparent",
      )}
      style={{
        transform: isResizing || isHovered ? "translateX(-2px)" : "none",
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize columns"
    />
  );
}

export const SpanResizer = memo(SpanResizerComponent);
export default SpanResizer;
