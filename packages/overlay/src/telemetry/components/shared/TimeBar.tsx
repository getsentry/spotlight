import { cn } from "~/lib/cn";

type TimeBarProps = {
  value: number;
  maxValue: number;
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export function TimeBar({ value, maxValue, title, children, className }: TimeBarProps) {
  const percentage = maxValue !== 0 ? Math.round((value / maxValue) * 100) : 100;

  return (
    <div title={title} className={cn("relative truncate text-left text-sm font-medium", className)}>
      {children}
      <div className={cn("bg-primary-800 h-1 w-full overflow-hidden rounded-full", children ? "mt-1" : "")}>
        <div className="h-full bg-lime-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
