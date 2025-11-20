/**
 * Validates if an origin should be allowed to access the Sidecar.
 *
 * Allowed origins:
 * - localhost with any port or protocol (http/https)
 * - https://spotlightjs.com (HTTPS only, default port)
 * - https://*.spotlightjs.com (HTTPS only, default port)
 *
 * @param origin - The origin to validate
 * @returns true if the origin is allowed, false otherwise
 */
export function isAllowedOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    // Allow localhost with any port and protocol (http or https)
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
      return true;
    }

    // Check for spotlightjs.com domains - must be HTTPS with default port
    if (url.protocol !== "https:" || (url.port !== "" && url.port !== "443")) {
      return false;
    }

    return hostname === "spotlightjs.com" || hostname.endsWith(".spotlightjs.com");
  } catch {
    // Invalid URL
    return false;
  }
}
