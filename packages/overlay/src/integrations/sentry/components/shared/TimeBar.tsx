import classNames from '~/lib/classNames';

type TimeBarProps = {
  value: number;
  maxValue: number;
  title?: string;
  text?: string;
  className?: string;
};

export function TimeBar({ value, maxValue, title, text, className }: TimeBarProps) {
  const percentage = maxValue !== 0 ? Math.round(value / maxValue) * 100 : 100;
  const tooltip = title ?? text ?? '';

  return (
    <div title={tooltip} className={classNames('relative text-left text-sm font-medium', className)}>
      {text && <div className="truncate text-lime-500">{text}</div>}
      <div className={classNames('bg-primary-800 h-1 w-full overflow-hidden rounded-full', text ? 'mt-1' : '')}>
        <div className="h-full bg-lime-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
