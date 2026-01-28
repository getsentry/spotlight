"use client";

import { cn, truncateId } from "@/lib/utils";
import { formatDuration } from "@/registry/new-york/trace-item/duration";
import { TimeSince } from "@/registry/new-york/trace-item/time-since";
import { EnvironmentBadge, MethodBadge, StatusBadge } from "@/registry/new-york/trace-item/trace-badge";
import type { TraceItemProps } from "@/registry/new-york/trace-item/types";
import { Activity, AlertCircle } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

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
function TraceItemComponent({ trace, isSelected = false, onSelect, className }: TraceItemProps) {
  const handleClick = useCallback(() => {
    onSelect?.(trace.trace_id, trace);
  }, [onSelect, trace]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.(trace.trace_id, trace);
      }
    },
    [onSelect, trace],
  );

  const duration = useMemo(
    () => formatDuration(trace.timestamp - trace.start_timestamp),
    [trace.timestamp, trace.start_timestamp],
  );
  const spanCount = trace.spans.size;
  const hasError = trace.status && trace.status !== "ok";
  const truncatedId = truncateId(trace.trace_id);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Trace ${truncatedId}: ${trace.rootTransactionName}`}
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
      <div className="shrink-0" aria-hidden="true">
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
        <span aria-hidden="true">–</span>
        <span>{duration}</span>
        <span aria-hidden="true">–</span>
        <span>{spanCount.toLocaleString()} spans</span>
      </div>
    </div>
  );
}

export const TraceItem = memo(TraceItemComponent);
export default TraceItem;
