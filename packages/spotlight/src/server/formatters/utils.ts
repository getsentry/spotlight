/**
 * Format a Sentry timestamp to an ISO string.
 *
 * Sentry SDKs are inconsistent about the timestamp format they emit:
 * - JavaScript SDKs send a numeric Unix timestamp in seconds (e.g. `1700660724.334`).
 * - Python (and some other) SDKs send an ISO 8601 string (e.g. `"2023-11-22T16:23:50.406684Z"`).
 *
 * Numeric values are treated as Unix seconds and converted to milliseconds. String values that
 * look numeric are handled the same way, while other strings are parsed as dates directly.
 * Falls back to epoch (1970-01-01T00:00:00.000Z) if the timestamp is missing or invalid, so that
 * downstream `.toISOString()` never throws a `RangeError: Invalid time value`.
 */
export function formatTimestamp(timestamp?: number | string): string {
  const date = parseTimestamp(timestamp);
  return (Number.isNaN(date.getTime()) ? new Date(0) : date).toISOString();
}

/**
 * Parse a Sentry timestamp (numeric Unix seconds or ISO 8601 string) into a Date.
 * Returns an invalid Date (NaN) if the value cannot be parsed.
 */
function parseTimestamp(timestamp?: number | string): Date {
  if (timestamp === undefined || timestamp === null || timestamp === "") {
    return new Date(0);
  }

  if (typeof timestamp === "number") {
    return new Date(timestamp * 1000);
  }

  // Numeric string, e.g. "1700660724.334" -> treat as Unix seconds.
  const numeric = Number(timestamp);
  if (!Number.isNaN(numeric)) {
    return new Date(numeric * 1000);
  }

  // Otherwise assume an ISO 8601 (or other Date-parseable) string.
  return new Date(timestamp);
}

/**
 * Get the duration in milliseconds between two Sentry timestamps.
 * Accepts timestamps as Unix seconds (numbers or numeric strings) or ISO 8601 strings.
 * Returns undefined if either timestamp is missing or invalid.
 */

export function getDuration(endTimestamp?: number | string, startTimestamp?: number | string): number | undefined {
  const end = toEpochSeconds(endTimestamp);
  const start = toEpochSeconds(startTimestamp);

  if (end !== undefined && start !== undefined) {
    return Math.round((end - start) * 1000);
  }

  return undefined;
}

/**
 * Convert a Sentry timestamp (Unix seconds, numeric string, or ISO 8601 string) to Unix seconds.
 * Returns undefined if the value is missing or cannot be parsed.
 */
function toEpochSeconds(timestamp?: number | string): number | undefined {
  if (timestamp === undefined || timestamp === null || timestamp === "") {
    return undefined;
  }

  if (typeof timestamp === "number") {
    return Number.isNaN(timestamp) ? undefined : timestamp;
  }

  const numeric = Number(timestamp);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const parsed = new Date(timestamp).getTime();
  return Number.isNaN(parsed) ? undefined : parsed / 1000;
}

/**
 * Map simple fields from source to data object.
 * Only sets fields if the source value is truthy.
 */
export function mapFields(source: any, data: Record<string, any>, fieldMappings: Record<string, string>): void {
  for (const [outputKey, sourcePath] of Object.entries(fieldMappings)) {
    const value = getNestedValue(source, sourcePath);
    if (value !== undefined && value !== null) {
      data[outputKey] = value;
    }
  }
}

/**
 * Map SDK name and version fields
 */
export function mapSdkFields(source: any, data: Record<string, any>): void {
  if (source.sdk?.name) {
    data.sdk = source.sdk.name;
    if (source.sdk.version) {
      data.sdk_version = source.sdk.version;
    }
  }
}

/**
 * Map tags directly to data object
 */
export function mapTags(source: any, data: Record<string, any>): void {
  if (source.tags) {
    for (const [key, value] of Object.entries(source.tags)) {
      data[key] = value;
    }
  }
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
