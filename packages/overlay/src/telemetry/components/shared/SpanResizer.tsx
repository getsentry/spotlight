import { useState } from "react";
import { cn } from "~/lib/cn";
import Resizer, { type ResizeDirection } from "./Resizer";

type SpanResizerProps = {
  handleResize: (e: MouseEvent) => void;
  setIsResizing: (val: boolean) => void;
  isResizing: boolean;
  direction?: ResizeDirection;
};

export default function SpanResizer({
  handleResize,
  isResizing,
  setIsResizing,
  direction = "column",
  ...props
}: SpanResizerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Resizer
      handleResize={handleResize}
      isResizing={isResizing}
      setIsResizing={setIsResizing}
      direction={direction}
      className={cn(
        "span-resizer absolute left-0 top-0 h-full w-1",
        direction === "column" ? "cursor-col-resize" : "cursor-row-resize",
        isResizing || isHovered ? "bg-primary-500" : "bg-transparent",
      )}
      style={{
        transform: isResizing || isHovered ? "translateX(-2px)" : "none",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    />
  );
}
