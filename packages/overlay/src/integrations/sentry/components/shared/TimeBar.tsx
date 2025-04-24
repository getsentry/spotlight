import classNames from '~/lib/classNames';

interface TimeBarProps {
  value: number;
  maxValue: number;
  title?: string;
  className?: string;
}

export function TimeBar({ value, maxValue, title, className }: TimeBarProps) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className={classNames('relative text-left text-sm font-medium', className)}>
      {title && <div className="truncate text-lime-500">{title}</div>}
      <div className={classNames('bg-primary-800 h-1 w-full overflow-hidden rounded-full', title ? 'mt-1' : '')}>
        <div className="h-full bg-lime-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
