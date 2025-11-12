import { RAW_TYPES } from "@spotlight/shared/constants.ts";

const CONTENT_TYPES_TO_EXTENSION: Record<string, string> = {
  "text/plain": "txt",
  "text/csv": "csv",
  "text/css": "css",
  "text/html": "html",
  "text/javascript": "js",
  "text/json": "json",
  "text/x-json": "json",
  "application/json": "json",
  "application/ld+json": "json",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function inferExtension(contentType?: string | null, itemType?: string | null): string {
  if (contentType) {
    const normalized = contentType.toLowerCase();
    const known = CONTENT_TYPES_TO_EXTENSION[normalized];
    if (known) {
      return known;
    }
    if (normalized.includes("json")) {
      return "json";
    }
    if (normalized.includes("text")) {
      return "txt";
    }
    if (normalized.includes("csv")) {
      return "csv";
    }
  }

  if (itemType && !RAW_TYPES.has(itemType)) {
    return "json";
  }

  return "bin";
}
