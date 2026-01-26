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
 * Formats a number with specified decimal places, removing trailing zeros.
 *
 * @param num - Number to format
 * @param decimalPlaces - Number of decimal places (default: 2)
 * @returns Formatted number string
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
