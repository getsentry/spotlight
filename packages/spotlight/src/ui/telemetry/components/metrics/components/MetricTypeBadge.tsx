import type { MetricType } from "@sentry/core";
import { cn } from "@spotlight/ui/lib/cn";

export default function MetricTypeBadge({ type }: { type: MetricType }) {
  const colors: Record<MetricType, string> = {
    counter: "bg-blue-600/30 text-blue-300 border-blue-500/30",
    gauge: "bg-green-600/30 text-green-300 border-green-500/30",
    distribution: "bg-purple-600/30 text-purple-300 border-purple-500/30",
  };

  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-xs uppercase",
        colors[type] || "bg-primary-700 text-primary-100",
      )}
    >
      {type}
    </span>
  );
}
