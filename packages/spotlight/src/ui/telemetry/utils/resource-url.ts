import type { Span } from "../types";

/**
 * Constructs an absolute URL for a resource image span.
 *
 * This is needed because span.description often contains relative paths (e.g., "/assets/image.png")
 * which work in browsers but fail in Electron apps running on different ports.
 *
 * @param span - The span object containing resource information
 * @returns Absolute URL string if it can be constructed, null otherwise
 */
export function getResourceImageUrl(span: Span): string | null {
  // Try to get an absolute URL from span data first
  if (span.data?.url && typeof span.data.url === "string") {
    try {
      new URL(span.data.url);
      return span.data.url;
    } catch {
      // Not a valid URL, continue
    }
  }

  if (span.data?.["http.url"] && typeof span.data["http.url"] === "string") {
    try {
      new URL(span.data["http.url"]);
      return span.data["http.url"];
    } catch {
      // Not a valid URL, continue
    }
  }

  // If description is a relative path, try to construct absolute URL
  if (span.description?.startsWith("/")) {
    // Try to extract origin from transaction request URL
    const requestUrl = span.transaction?.request?.url;
    if (requestUrl && typeof requestUrl === "string") {
      try {
        const url = new URL(requestUrl);
        return `${url.origin}${span.description}`;
      } catch {
        // Invalid URL, fall through
      }
    }

    // Fallback: if we're in a browser context, use the current origin
    if (typeof window !== "undefined" && window.location) {
      return `${window.location.origin}${span.description}`;
    }
  }

  // If description is already an absolute URL, return it
  if (span.description) {
    try {
      new URL(span.description);
      return span.description;
    } catch {
      // Not a valid URL
    }
  }

  return null;
}
