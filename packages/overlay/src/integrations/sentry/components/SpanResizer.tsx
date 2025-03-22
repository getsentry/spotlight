import { useState } from 'react';
import classNames from '~/lib/classNames';
import Resizer from './Resizer';

type SpanResizerProps = {
  handleResize: (e: MouseEvent) => void;
  setIsResizing: (val: boolean) => void;
  isResizing: boolean;
};

export default function SpanResizer({ handleResize, isResizing, setIsResizing, ...props }: SpanResizerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Resizer
      handleResize={handleResize}
      isResizing={isResizing}
      setIsResizing={setIsResizing}
      className={classNames(
        'span-resizer absolute left-0 top-0 h-full w-2 cursor-col-resize',
        isResizing || isHovered ? 'bg-primary-500' : 'bg-transparent',
      )}
      style={{
        transform: isResizing || isHovered ? 'translateX(-2px)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    />
  );
}
