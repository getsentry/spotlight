import { ReactNode, useState } from 'react';
import classNames from '~/lib/classNames';

const getPositionClass = (position: string) => {
  switch (position) {
    case 'top':
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    case 'bottom':
      return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
    case 'left':
      return 'top-1/2 right-full transform -translate-y-1/2 mr-2';
    default:
      return 'top-1/2 left-full transform -translate-y-1/2 ml-2';
  }
};

const Tooltip = ({
  content,
  position = 'right',
  children,
}: {
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div className="relative inline-block max-w-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && <div className={classNames('absolute z-10', getPositionClass(position))}>{content}</div>}
    </div>
  );
};

export default Tooltip;
