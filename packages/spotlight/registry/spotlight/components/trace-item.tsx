"use client";

import { TimeSince } from "@/registry/spotlight/components/time-since";
import { EnvironmentBadge, MethodBadge, StatusBadge } from "@/registry/spotlight/components/trace-badge";
import { formatDuration } from "@/registry/spotlight/lib/duration";
import type { TraceItemProps } from "@/registry/spotlight/lib/types";
import { cn } from "@/registry/spotlight/lib/utils";
import { truncateId } from "@/registry/spotlight/lib/utils";
import { Activity, AlertCircle } from "lucide-react";

/**
 * TraceItem renders a summary row for a single distributed trace.
 * It displays the trace ID, timing, status, and transaction name.
 *
 * Features:
 * - Status icon (Activity for ok, AlertCircle for errors)
 * - Truncated trace ID with relative timestamp
 * - Transaction method and name display
 * - Duration and span count stats
 * - Optional environment badge
 *
 * @example
 * ```tsx
 * <TraceItem
 *   trace={traceData}
 *   isSelected={selectedTraceId === traceData.trace_id}
 *   onSelect={(id, trace) => {
 *     setSelectedTraceId(id);
 *     console.log("Selected trace:", trace);
 *   }}
 * />
 * ```
 *
 * @example In a list
 * ```tsx
 * <div className="divide-y">
 *   {traces.map((trace) => (
 *     <TraceItem
 *       key={trace.trace_id}
 *       trace={trace}
 *       isSelected={selectedId === trace.trace_id}
 *       onSelect={setSelectedId}
 *     />
 *   ))}
 * </div>
 * ```
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
        "flex cursor-pointer items-center gap-x-4 px-6 py-3",
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
      <div className="flex w-40 flex-col font-mono text-sm">
        <div className="flex items-center gap-x-2">
          <span className="text-foreground">{truncatedId}</span>
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
