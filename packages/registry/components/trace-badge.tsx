"use client";

import type { TraceBadgeProps } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * TraceBadge displays contextual badges for trace visualization.
 * Supports different variants for status, HTTP method, and environment.
 */
export function TraceBadge({ variant, value, className }: TraceBadgeProps) {
  if (!value) return null;

  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors";

  const variantClasses = {
    status: getStatusClasses(value),
    method: "border-transparent bg-muted text-foreground font-mono",
    environment: "border-transparent bg-secondary text-secondary-foreground",
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {variant === "status" ? value.toUpperCase() : value}
    </span>
  );
}

/**
 * Returns appropriate classes based on status value.
 */
function getStatusClasses(status: string): string {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "ok") {
    return "border-green-500/30 bg-green-500/20 text-green-500";
  }

  if (normalizedStatus === "error" || normalizedStatus === "internal_error" || normalizedStatus === "cancelled") {
    return "border-destructive/30 bg-destructive/20 text-destructive";
  }

  // Default/unknown status
  return "border-muted-foreground/30 bg-muted text-muted-foreground";
}

/**
 * StatusBadge is a convenience wrapper for status variant.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return <TraceBadge variant="status" value={status} className={className} />;
}

/**
 * MethodBadge is a convenience wrapper for HTTP method variant.
 */
export function MethodBadge({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  return <TraceBadge variant="method" value={method} className={className} />;
}

/**
 * EnvironmentBadge is a convenience wrapper for environment variant.
 */
export function EnvironmentBadge({
  environment,
  className,
}: {
  environment: string;
  className?: string;
}) {
  return <TraceBadge variant="environment" value={environment} className={className} />;
}

export default TraceBadge;
