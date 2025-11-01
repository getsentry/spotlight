/**
 * Format a Sentry timestamp (in seconds) to ISO string.
 * Sentry timestamps are Unix timestamps in seconds, so we multiply by 1000 to convert to milliseconds.
 * Falls back to epoch (1970-01-01T00:00:00.000Z) if timestamp is missing/invalid.
 */
export function formatTimestamp(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp * 1000) : new Date(0);
  return date.toISOString();
}

/**
 * Get the duration in milliseconds between two Sentry timestamps.
 * Accepts timestamps in seconds (as numbers or strings).
 * Returns undefined if either timestamp is missing or invalid.
 */

export function getDuration(endTimestamp?: number | string, startTimestamp?: number | string): number | undefined {
  const end = typeof endTimestamp === "string" ? Number.parseFloat(endTimestamp) : endTimestamp;
  const start = typeof startTimestamp === "string" ? Number.parseFloat(startTimestamp) : startTimestamp;

  if (typeof end === "number" && typeof start === "number" && !Number.isNaN(end) && !Number.isNaN(start)) {
    return Math.round((end - start) * 1000);
  }

  return undefined;
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
