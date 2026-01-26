/**
 * Generic span interface compatible with OpenTelemetry trace data.
 * This represents a single unit of work within a distributed trace.
 */
export interface SpanData {
  /** Unique identifier for this span */
  span_id: string;
  /** Trace ID this span belongs to */
  trace_id?: string;
  /** Parent span ID, null for root spans */
  parent_span_id?: string | null;
  /** Operation name (e.g., "http.request", "db.query") */
  op?: string | null;
  /** Human-readable description of the span */
  description?: string | null;
  /** Start time as Unix timestamp in milliseconds */
  start_timestamp: number;
  /** End time as Unix timestamp in milliseconds */
  timestamp: number;
  /** Span status ("ok", "error", or custom string) */
  status?: "ok" | "error" | string;
  /** Child spans */
  children?: SpanData[];
  /** Additional span attributes/data */
  data?: Record<string, unknown>;
  /** Key-value tags for filtering and categorization */
  tags?: Record<string, string>;
}

/**
 * Generic trace interface representing a complete distributed trace.
 * Contains all spans and metadata for a single trace.
 */
export interface TraceData {
  /** Unique trace identifier */
  trace_id: string;
  /** Start time of the trace (earliest span start) */
  start_timestamp: number;
  /** End time of the trace (latest span end) */
  timestamp: number;
  /** Overall trace status */
  status?: "ok" | "error" | string;
  /** Map of span_id to SpanData for quick lookups */
  spans: Map<string, SpanData>;
  /** Hierarchical tree of spans with children populated */
  spanTree: SpanData[];
  /** Name of the root transaction/operation */
  rootTransactionName: string;
  /** HTTP method if applicable (GET, POST, etc.) */
  rootTransactionMethod?: string;
  /** Number of transactions in this trace */
  transactionCount?: number;
  /** Total number of spans */
  spanCount?: number;
  /** Platform identifier (e.g., "javascript", "python") */
  platform?: string;
  /** Environment (e.g., "production", "development") */
  environment?: string;
}

/**
 * Props for the TraceItem component.
 * Renders a summary row for a single trace.
 */
export interface TraceItemProps {
  /** The trace data to render */
  trace: TraceData;
  /** Whether this trace is currently selected */
  isSelected?: boolean;
  /** Callback when trace is clicked */
  onSelect?: (traceId: string, trace: TraceData) => void;
  /** Custom class name */
  className?: string;
}

/**
 * Props for the TimeSince component.
 * Displays relative time (e.g., "2 minutes ago").
 */
export interface TimeSinceProps extends React.HTMLAttributes<HTMLTimeElement> {
  /** The date/timestamp to show relative time for */
  date: string | number | Date;
  /** How often to refresh the display in milliseconds (default: 5000) */
  refreshInterval?: number;
}

/**
 * Variant types for trace badges.
 */
export type TraceBadgeVariant = "status" | "method" | "environment";

/**
 * Props for TraceBadge component.
 */
export interface TraceBadgeProps {
  /** The badge variant */
  variant: TraceBadgeVariant;
  /** The value to display */
  value: string;
  /** Custom class name */
  className?: string;
}
