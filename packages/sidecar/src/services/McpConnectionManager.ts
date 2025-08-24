import type { StreamableHTTPTransport } from "@hono/mcp";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { trackConnectionError, trackConnectionOpen } from "../mcp/tracking.js";

/**
 * Manages MCP server connection lifecycle
 */
export class McpConnectionManager {
  constructor(
    private readonly mcp: McpServer,
    private readonly transport: StreamableHTTPTransport,
  ) {}

  /**
   * Ensure MCP server is connected
   * Handles connection tracking and error reporting
   */
  async ensureConnection(): Promise<void> {
    if (!this.mcp.isConnected()) {
      try {
        await this.mcp.connect(this.transport);

        trackConnectionOpen(undefined, {
          transport: "http",
          timestamp: new Date().toISOString(),
          status: "connected",
        });
      } catch (error) {
        trackConnectionError(undefined, String(error), {
          transport: "http",
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    }
  }

  /**
   * Check if MCP server is connected
   */
  isConnected(): boolean {
    return this.mcp.isConnected();
  }
}
