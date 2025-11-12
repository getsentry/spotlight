import { log } from "@spotlight/ui/lib/logger";

export function parseJSONFromBuffer<T = unknown>(data: Uint8Array): T {
  try {
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch (err) {
    log(err);
    return {} as T;
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
