import { log } from "./lib/logger";

export function connectToSidecar(
  sidecarUrl: string,
  // Content Type to listener
  contentTypeListeners: Record<string, (event: string) => void>,
  setOnline: (online: boolean) => void,
): () => void {
  log("Connecting to sidecar at", sidecarUrl);
  const sidecarStreamUrl = new URL("/stream", sidecarUrl);
  sidecarStreamUrl.searchParams.append("base64", "1");

  // TODO: Include version number once we have a reliable way to get it at runtime
  const clientId = "spotlight-overlay";
  sidecarStreamUrl.searchParams.append("client", clientId);
  const source = new EventSource(sidecarStreamUrl.href);

  // Track last event ID for debugging and deduplication
  let lastEventId: string | null = null;
  let reconnectCount = 0;

  // Store listener functions so they can be properly removed later
  const listenerFunctions = new Map<string, (event: MessageEvent<string>) => void>();

  for (const [contentType, listener] of Object.entries(contentTypeListeners)) {
    const listenerFunc = (event: MessageEvent<string>) => {
      // Track the last event ID (EventSource automatically uses this for Last-Event-ID header)
      if (event.lastEventId) {
        const previousEventId = lastEventId;
        lastEventId = event.lastEventId;

        // Log reconnection catch-up events
        if (reconnectCount > 0 && previousEventId) {
          log(`Received event ${lastEventId} (catching up after reconnection)`);
        }
      }

      listener(event.data);
    };

    listenerFunctions.set(contentType, listenerFunc);
    source.addEventListener(`${contentType}`, listenerFunc);
  }

  source.addEventListener("open", () => {
    setOnline(true);
    if (reconnectCount > 0) {
      log(`Sidecar reconnected (attempt ${reconnectCount}), last event ID: ${lastEventId || "none"}`);
    } else {
      log("Sidecar connected");
    }
  });

  source.addEventListener("error", err => {
    setOnline(false);
    reconnectCount++;
    console.error("Sidecar connection error:", err);
    log(`Connection error, will attempt to reconnect (last event ID: ${lastEventId || "none"})`);
  });

  return () => {
    log("Removing all content type listeners");
    for (const [contentType, listenerFunc] of listenerFunctions.entries()) {
      source.removeEventListener(contentType, listenerFunc);
      log("Removed listener for type", contentType);
    }
    listenerFunctions.clear();
    source.close();
  };
}
