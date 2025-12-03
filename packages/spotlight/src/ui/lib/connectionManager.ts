import { log } from "./logger";

/**
 * Connection manager for switching between Spotlight instances
 */
export class ConnectionManager {
  private currentDisconnect: (() => void) | null = null;
  private currentUrl: string | null = null;

  /**
   * Switch to a different Spotlight instance
   * This will disconnect from the current instance and connect to the new one
   */
  async switchInstance(
    newPort: number,
    onConnect: (url: string) => () => void,
    onReset: () => void,
  ): Promise<void> {
    const newUrl = `http://localhost:${newPort}`;

    // Already connected to this instance
    if (this.currentUrl === newUrl) {
      log("Already connected to", newUrl);
      return;
    }

    log("Switching instance to", newUrl);

    // 1. Disconnect from current sidecar
    if (this.currentDisconnect) {
      log("Disconnecting from current instance");
      this.currentDisconnect();
      this.currentDisconnect = null;
    }

    // 2. Clear/reset store state
    log("Resetting store state");
    onReset();

    // 3. Update sidecar URL to target port
    this.currentUrl = newUrl;

    // 4. Reconnect to new sidecar
    log("Connecting to new instance");
    this.currentDisconnect = onConnect(newUrl);

    // 5. Fresh data will be fetched automatically via the new SSE connection
    log("Successfully switched to instance at", newUrl);
  }

  /**
   * Get the current connection URL
   */
  getCurrentUrl(): string | null {
    return this.currentUrl;
  }

  /**
   * Disconnect from the current instance
   */
  disconnect(): void {
    if (this.currentDisconnect) {
      log("Disconnecting from current instance");
      this.currentDisconnect();
      this.currentDisconnect = null;
      this.currentUrl = null;
    }
  }
}

// Singleton instance
let connectionManager: ConnectionManager | null = null;

/**
 * Get the singleton connection manager instance
 */
export function getConnectionManager(): ConnectionManager {
  if (!connectionManager) {
    connectionManager = new ConnectionManager();
  }
  return connectionManager;
}
