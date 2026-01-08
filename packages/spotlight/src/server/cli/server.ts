import type { AddressInfo } from "node:net";
import { PortInUseError, setupSpotlight } from "../main.ts";
import { logger } from "../logger.ts";
import type { CLIHandlerOptions, Command, CommandMeta } from "../types/cli.ts";
import { openInBrowser } from "../utils/extras.ts";

export const meta: CommandMeta = {
  name: "server",
  short: "Start the Spotlight sidecar server (default command)",
  usage: "spotlight [server] [options]",
  long: `Start the Spotlight sidecar HTTP server.

This is the default command when running 'spotlight' without arguments.
The server listens for events from Sentry SDKs and serves the Spotlight UI.

The server provides:
  - HTTP endpoint for receiving Sentry envelopes
  - Server-Sent Events (SSE) stream for real-time updates
  - Web UI at http://localhost:PORT`,
  examples: [
    "spotlight                          # Start on default port 8969",
    "spotlight server                   # Explicit server command",
    "spotlight --open                   # Start and open dashboard in browser",
    "spotlight --port 3000              # Start on port 3000",
    "spotlight -p 3000 -d               # Start on port 3000 with debug logging",
  ],
};

export async function handler({ port, basePath, filesToServe, allowedOrigins, open }: CLIHandlerOptions) {
  try {
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
  } catch (err) {
    if (err instanceof PortInUseError) {
      logger.error(err.message);
      process.exit(1);
    }
    throw err; // Re-throw other errors (keeps normal behavior)
  }
}

export default { meta, handler } satisfies Command;
