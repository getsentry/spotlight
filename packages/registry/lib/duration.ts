/**
 * Duration formatting utilities for trace visualization.
 * Converts millisecond durations to human-readable strings.
 */

/**
 * Labels for duration units, keyed by millisecond thresholds.
 */
export const DURATION_LABELS: Record<number, string> = {
  31557600000: "yr",
  2629800000: "mo",
  604800000: "wk",
  86400000: "d",
  3600000: "hr",
  60000: "min",
  1000: "s",
};

/**
 * Sorted duration thresholds from largest to smallest.
 */
const DURATIONS = Object.keys(DURATION_LABELS)
  .map(Number)
  .sort((a, b) => b - a);

/**
 * Returns a Tailwind class name for coloring duration text based on thresholds.
 * Uses shadcn-compatible color tokens.
 *
 * @param duration - Duration in milliseconds
 * @returns Tailwind class name for text color
 *
 * @example
 * getDurationClassName(1500) // "text-destructive" (> 1s)
 * getDurationClassName(600)  // "text-orange-500" (> 500ms)
 * getDurationClassName(150)  // "text-yellow-500" (> 100ms)
 * getDurationClassName(50)   // "text-muted-foreground" (< 100ms)
 */
export function getDurationClassName(duration: number): string {
  if (duration > 1000) return "text-destructive";
  if (duration > 500) return "text-orange-500";
  if (duration > 100) return "text-yellow-500";
  return "text-muted-foreground";
}

/**
 * Formats a number with specified decimal places, removing trailing zeros.
 *
 * @param num - Number to format
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1.5, 2)  // "1.5"
 * formatNumber(2.0, 2)  // "2"
 * formatNumber(3.14159, 2) // "3.14"
 */
export function formatNumber(num: number, decimalPlaces = 2): string {
  return num.toFixed(decimalPlaces).replace(/\.?0+$/, "");
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 * Automatically selects the most appropriate unit.
 *
 * @param duration - Duration in milliseconds
 * @returns Formatted duration string with unit
 *
 * @example
 * formatDuration(500)      // "500ms"
 * formatDuration(1500)     // "1.5s"
 * formatDuration(65000)    // "1.08min"
 * formatDuration(3700000)  // "1.03hr"
 */
export function formatDuration(duration: number): string {
  for (const limit of DURATIONS) {
    if (duration >= limit) {
      const num = formatNumber(duration / limit);
      return `${num}${DURATION_LABELS[limit]}`;
    }
  }
  return `${formatNumber(duration)}ms`;
}

/**
 * Calculates and formats the duration of a span.
 *
 * @param span - Object with start_timestamp and timestamp properties
 * @returns Formatted duration string
 *
 * @example
 * formatSpanDuration({ start_timestamp: 1000, timestamp: 1500 }) // "500ms"
 */
export function formatSpanDuration(span: {
  timestamp: number;
  start_timestamp: number;
}): string {
  return formatDuration(span.timestamp - span.start_timestamp);
}
