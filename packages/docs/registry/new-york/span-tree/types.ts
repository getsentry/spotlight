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
 * Props for the SpanTree component.
 * Renders a hierarchical waterfall visualization of spans.
 */
export interface SpanTreeProps {
  /** Array of root spans (with children populated) */
  spans: SpanData[];
  /** Start timestamp of the entire trace (for waterfall positioning) */
  traceStartTimestamp: number;
  /** Total duration of the trace in milliseconds */
  traceDuration: number;
  /** Currently selected span ID */
  selectedSpanId?: string;
  /** Callback when a span is clicked */
  onSpanSelect?: (spanId: string, span: SpanData) => void;
  /** Optional: Set of span IDs to highlight (e.g., search results) */
  highlightedSpanIds?: Set<string>;
  /** Initial width percentage of the span name column (default: 50) */
  initialNodeWidth?: number;
  /** Custom class name for the root element */
  className?: string;
}

/**
 * Props for individual SpanItem component.
 * Renders a single span row with timing bar and children.
 */
export interface SpanItemProps {
  /** The span data to render */
  span: SpanData;
  /** Start timestamp of the entire trace */
  startTimestamp: number;
  /** Total duration of the trace in milliseconds */
  totalDuration: number;
  /** Current nesting depth (used for auto-collapse) */
  depth?: number;
  /** Currently selected span ID */
  selectedSpanId?: string;
  /** Set of span IDs to highlight */
  highlightedSpanIds?: Set<string>;
  /** Callback when this span is clicked */
  onSpanSelect?: (spanId: string, span: SpanData) => void;
  /** Current width of the span name column (percentage) */
  spanNodeWidth: number;
  /** Callback to update the span name column width */
  onNodeWidthChange?: (width: number) => void;
}

/**
 * Props for the SpanResizer component.
 * Handles draggable resize of the span name column.
 */
export interface SpanResizerProps {
  /** Callback during resize with mouse event */
  handleResize: (e: MouseEvent) => void;
  /** Whether currently resizing */
  isResizing: boolean;
  /** Callback to set resizing state */
  setIsResizing: (val: boolean) => void;
}
