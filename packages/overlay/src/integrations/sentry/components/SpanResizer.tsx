import { useState, type MouseEventHandler } from 'react';
import classNames from '~/lib/classNames';

type SpanResizerProps = {
  handleResize: (e: MouseEvent) => void;
  setIsResizing: (val: boolean) => void;
  isResizing: boolean;
};

export default function SpanResizer({ handleResize, isResizing, setIsResizing, ...props }: SpanResizerProps) {
  const [isResizerHovered, setIsResizerHovered] = useState(false);

  const handleResizeWrapper = (e: MouseEvent) => {
    if (e.target instanceof HTMLDivElement) {
      handleResize(e);
    }
  };
  const handleMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault();
    setIsResizerHovered(true);
    setIsResizing(true);
    document.addEventListener('mousemove', handleResizeWrapper);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeWrapper);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  return (
    <div
      className={classNames(
        'resizer',
        'absolute left-0 top-0 h-full w-1 cursor-col-resize rounded-sm p-0.5 transition-colors',
        isResizerHovered || isResizing ? 'bg-primary-600 translate-x-[-2px] transform' : '',
      )}
      onClick={e => e.preventDefault()}
      onMouseEnter={() => setIsResizerHovered(true)}
      onMouseLeave={() => setIsResizerHovered(false)}
      onMouseOver={() => setIsResizerHovered(true)}
      onMouseDown={handleMouseDown}
      {...props}
    />
  );
}
