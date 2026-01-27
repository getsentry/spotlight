"use client";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/registry/new-york/trace-item/duration";
import { TimeSince } from "@/registry/new-york/trace-item/time-since";
import { EnvironmentBadge, MethodBadge, StatusBadge } from "@/registry/new-york/trace-item/trace-badge";
import type { TraceItemProps } from "@/registry/new-york/trace-item/types";
import { Activity, AlertCircle } from "lucide-react";

/**
 * Truncates an ID string to a specified length.
 */
function truncateId(id = "", length = 8): string {
  return id.substring(0, length);
}

/**
 * TraceItem renders a summary row for a single distributed trace.
 */
export function TraceItem({ trace, isSelected = false, onSelect, className }: TraceItemProps) {
  const handleClick = () => {
    onSelect?.(trace.trace_id, trace);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const duration = formatDuration(trace.timestamp - trace.start_timestamp);
  const spanCount = trace.spans.size;
  const hasError = trace.status && trace.status !== "ok";
  const truncatedId = truncateId(trace.trace_id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex cursor-pointer items-center gap-x-4 px-6 py-2",
        "hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted",
        className,
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {hasError ? (
          <AlertCircle className="h-5 w-5 text-destructive" />
        ) : (
          <Activity className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Trace ID and Time */}
      <div className="flex w-48 flex-col truncate font-mono text-sm">
        <div className="flex items-center gap-x-2">
          <span className="text-muted-foreground">{truncatedId}</span>
          {trace.environment && <EnvironmentBadge environment={trace.environment} />}
        </div>
        <TimeSince date={trace.start_timestamp} className="text-muted-foreground text-xs" />
      </div>

      {/* Transaction Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {trace.rootTransactionMethod && <MethodBadge method={trace.rootTransactionMethod} />}
          <span className="truncate font-medium" title={trace.rootTransactionName}>
            {trace.rootTransactionName}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
        {hasError ? <StatusBadge status={trace.status!} /> : <span className="text-green-500">ok</span>}
        <span>–</span>
        <span>{duration}</span>
        <span>–</span>
        <span>{spanCount.toLocaleString()} spans</span>
      </div>
    </div>
  );
}

export default TraceItem;
