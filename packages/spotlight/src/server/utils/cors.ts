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

    // Allow localhost with any port and protocol (http or https)
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]") {
      return true;
    }

    // Check for spotlightjs.com domains
    const hostname = url.hostname.toLowerCase();
    const isSpotlightDomain = hostname === "spotlightjs.com" || hostname.endsWith(".spotlightjs.com");

    if (isSpotlightDomain) {
      // Must be HTTPS
      if (url.protocol !== "https:") {
        return false;
      }

      // Must be default port (443) or unspecified
      if (url.port !== "" && url.port !== "443") {
        return false;
      }

      return true;
    }

    // All other origins are rejected
    return false;
  } catch {
    // Invalid URL
    return false;
  }
}
