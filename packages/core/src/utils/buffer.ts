import { getLogger } from "../lib";

/**
 * Parse JSON data from a Uint8Array buffer
 */
export function parseJSONFromBuffer<T = unknown>(data: Uint8Array): T {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch (err) {
    const logger = getLogger();
    logger.error(`Failed to parse JSON from buffer: ${err}`);
    return {} as T;
  }
}

/**
 * Parse string data from a Uint8Array buffer
 */
export function parseStringFromBuffer(data: Uint8Array): string | null {
  try {
    return new TextDecoder().decode(data);
  } catch (err) {
    const logger = getLogger();
    logger.error(`Failed to parse string from buffer: ${err}`);
    return null;
  }
}
