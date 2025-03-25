import { log } from '~/lib/logger';

export function parseJSONFromBuffer<T = unknown>(data: Uint8Array): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch (err) {
    log(err);
    return null;
  }
}

export function parseStringFromBuffer(data: Uint8Array): string | null {
  try {
    return new TextDecoder().decode(data);
  } catch (err) {
    log(err);
    return null;
  }
}
