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

  for (const [contentType, listener] of Object.entries(contentTypeListeners)) {
    source.addEventListener(`${contentType}`, (event: MessageEvent<string>) => listener(event.data));
  }

  source.addEventListener("open", () => {
    setOnline(true);
    log("Sidecar connected");
  });

  source.addEventListener("error", err => {
    setOnline(false);
    console.error("Sidecar connection error:", err);
  });

  return () => {
    log("Removing all content type listeners");
    for (const [contentType, listener] of Object.entries(contentTypeListeners)) {
      source.removeEventListener(contentType, (event: MessageEvent<string>) => listener(event.data));
      log("Removed listener for type", contentType);
    }
  };
}
