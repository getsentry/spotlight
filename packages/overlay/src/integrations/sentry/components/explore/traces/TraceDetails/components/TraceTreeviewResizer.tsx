import { useState } from 'react';
import Resizer from '~/integrations/sentry/components/Resizer';
import classNames from '~/lib/classNames';
import { ReactComponent as ResizerIcon } from '../../../../../../../assets/resizer.svg';

type TraceTreeviewResizerProps = {
  handleResize: (e: MouseEvent) => void;
  setIsResizing: (val: boolean) => void;
  isResizing: boolean;
};

export default function TraceTreeviewResizer({
  handleResize,
  isResizing,
  setIsResizing,
  ...props
}: TraceTreeviewResizerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Resizer
      handleResize={handleResize}
      isResizing={isResizing}
      setIsResizing={setIsResizing}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <div
        className={classNames(
          'trace-treeview-resizer bottom-0 left-0 flex h-auto w-auto cursor-row-resize items-center justify-center rounded-b-sm p-1',
          isHovered || isResizing ? 'bg-primary-700' : 'bg-primary-800',
        )}
      >
        <ResizerIcon width={18} height={18} className="rotate-90 fill-white" />
      </div>
    </Resizer>
  );
}
