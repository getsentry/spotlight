import { HTMLAttributes, ReactNode, useRef, type MouseEventHandler } from 'react';
import classNames from '~/lib/classNames';

export type ResizerProps = {
  handleResize: (e: MouseEvent) => void;
  setIsResizing: (val: boolean) => void;
  isResizing: boolean;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
} & Omit<HTMLAttributes<HTMLDivElement>, 'onMouseDown' | 'onClick'>;

export default function Resizer({
  handleResize,
  isResizing,
  setIsResizing,
  className = '',
  children,
  style,
  ...props
}: ResizerProps) {
  // Use a ref to store the last update time for throttling
  const lastUpdateTimeRef = useRef<number>(0);
  // Use a ref to store the last position for detecting actual movement
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  const handleResizeWrapper = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLDivElement)) {
      return;
    }

    const now = Date.now();
    const throttleInterval = 16; // Approximately 60fps

    // Check if enough time has passed since the last update (throttling)
    if (now - lastUpdateTimeRef.current <= throttleInterval) {
      return;
    }

    // Initialize last position if it's null
    if (lastPositionRef.current === null) {
      lastPositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Calculate actual movement
    const deltaX = e.clientX - lastPositionRef.current.x;
    const deltaY = e.clientY - lastPositionRef.current.y;

    // Only process if there's actual movement
    if (deltaX !== 0 || deltaY !== 0) {
      // Update last position
      lastPositionRef.current = { x: e.clientX, y: e.clientY };

      // Update last update time
      lastUpdateTimeRef.current = now;

      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        handleResize(e);
      });
    }
  };

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault();

    // Reset the last position
    lastPositionRef.current = { x: e.clientX, y: e.clientY };

    setIsResizing(true);
    document.addEventListener('mousemove', handleResizeWrapper);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    // Reset the last position
    lastPositionRef.current = null;

    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeWrapper);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={classNames('resizer', isResizing ? 'is-resizing' : '', className)}
      style={style}
      onClick={e => e.preventDefault()}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {children}
    </div>
  );
}
