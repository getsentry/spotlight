"use client";

import type { SpanResizerProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

/**
 * SpanResizer component provides a draggable handle for resizing
 * the span name column width in the waterfall visualization.
 */
export function SpanResizer({ handleResize, isResizing, setIsResizing }: SpanResizerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const lastUpdateRef = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
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
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
}

export default SpanResizer;
