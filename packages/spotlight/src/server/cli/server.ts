import type { AddressInfo } from "node:net";
import { setupSpotlight } from "../main.ts";
import type { CLIHandlerOptions } from "../types/cli.ts";
import { openInBrowser } from "../utils/extras.ts";

export default async function server({ port, basePath, filesToServe, allowedOrigins, open }: CLIHandlerOptions) {
  const serverInstance = await setupSpotlight({
    port,
    basePath,
    filesToServe,
    isStandalone: true,
    allowedOrigins,
  });

  if (open) {
    // Use actual port from server instance, or fall back to requested port
    // (when serverInstance is undefined, a server is already running on the requested port)
    const actualPort = serverInstance ? (serverInstance.address() as AddressInfo).port : port;
    openInBrowser(actualPort);
  }

  return serverInstance;
}
