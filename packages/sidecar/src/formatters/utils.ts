/**
 * Format a Sentry timestamp (in seconds) to ISO string.
 * Sentry timestamps are Unix timestamps in seconds, so we multiply by 1000 to convert to milliseconds.
 * Falls back to epoch (1970-01-01T00:00:00.000Z) if timestamp is missing/invalid.
 */
export function formatTimestamp(timestamp: number | undefined): string {
  if (timestamp !== undefined && Number.isFinite(timestamp)) {
    return new Date(timestamp * 1000).toISOString();
  }
  return new Date(0).toISOString();
}
