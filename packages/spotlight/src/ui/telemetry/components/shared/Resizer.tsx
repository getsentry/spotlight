import { type HTMLAttributes, type MouseEventHandler, type ReactNode, useRef } from "react";
import { cn } from "@spotlight/ui/lib/cn";

export type ResizeDirection = "column" | "row";

export type ResizerProps = {
  handleResize: (e: MouseEvent) => void;
  setIsResizing: (val: boolean) => void;
  isResizing: boolean;
  direction?: ResizeDirection;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
} & Omit<HTMLAttributes<HTMLDivElement>, "onMouseDown" | "onClick">;

export default function Resizer({
  handleResize,
  isResizing,
  setIsResizing,
  direction = "column",
  className = "",
  children,
  style,
  ...props
}: ResizerProps) {
  const lastUpdateTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  const handleResizeWrapper = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLDivElement)) {
      return;
    }

    const now = Date.now();
    const throttleInterval = 16; // Approximately 60fps

    if (now - lastUpdateTimeRef.current <= throttleInterval) {
      return;
    }

    if (lastPositionRef.current === null) {
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const deltaX = e.clientX - lastPositionRef.current.x;
    const deltaY = e.clientY - lastPositionRef.current.y;

    if (deltaX !== 0 || deltaY !== 0) {
      lastPositionRef.current = { x: e.clientX, y: e.clientY };

      lastUpdateTimeRef.current = now;

      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        handleResize(e);
      });
    }
  };

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault();
    lastPositionRef.current = { x: e.clientX, y: e.clientY };

    setIsResizing(true);
    document.addEventListener("mousemove", handleResizeWrapper);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    lastPositionRef.current = null;

    setIsResizing(false);
    document.removeEventListener("mousemove", handleResizeWrapper);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={cn("resizer", isResizing ? "is-resizing" : "", className)}
      style={style}
      onClick={e => e.preventDefault()}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {children}
    </div>
  );
}
