import { log } from "./lib/logger";

/**
 * Extracts browser name from User-Agent
 */
function getBrowserName(userAgent: string): string {
  if (userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
    return "Chrome";
  }
  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
    return "Safari";
  }
  if (userAgent.includes("Edg/")) {
    return "Edge";
  }
  return "Unknown";
}

export function connectToSidecar(
  sidecarUrl: string,
  // Content Type to listener
  contentTypeListeners: Record<string, (event: { data: string | Uint8Array }) => void>,
  setOnline: (online: boolean) => void,
): () => void {
  log("Connecting to sidecar at", sidecarUrl);
  const sidecarStreamUrl = new URL("/stream", sidecarUrl);
  sidecarStreamUrl.searchParams.append("base64", "1");

  // Build client identifier in user-agent format
  // Format: spotlight-overlay (Browser; hostname)
  let clientId = "spotlight-overlay";

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const userAgent = window.navigator.userAgent;
    const browserName = getBrowserName(userAgent);

    // Add platform info in parentheses
    const platformParts = [browserName];
    if (hostname && hostname !== "localhost") {
      platformParts.push(hostname);
    }

    if (platformParts.length > 0) {
      clientId += ` (${platformParts.join("; ")})`;
    }
  }

  sidecarStreamUrl.searchParams.append("client", clientId);
  const source = new EventSource(sidecarStreamUrl.href);

  for (const [contentType, listener] of Object.entries(contentTypeListeners)) {
    source.addEventListener(`${contentType}`, listener);
  }

  source.addEventListener("open", () => {
    setOnline(true);
    log(`Sidecar connected as: ${clientId}`);
  });

  source.addEventListener("error", err => {
    setOnline(false);
    console.error("Sidecar connection error:", err);
  });

  return () => {
    log("Removing all content type listeners");
    for (const [contentType, listener] of Object.entries(contentTypeListeners)) {
      source.removeEventListener(contentType, listener);
      log("Removed listener for type", contentType);
    }
  };
}
