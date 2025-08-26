import type { StreamableHTTPTransport } from "@hono/mcp";
import type { Context } from "hono";
import type { HonoEnv } from "../utils.js";
import type { ClientInfoExtractor } from "./ClientInfoExtractor.js";
import { runWithClientContext } from "./McpRequestContext.js";

/**
 * Interface for MCP transport with tracking capabilities
 */
export interface TrackedMcpTransport {
  handleRequest(ctx: Context<HonoEnv>): Promise<Response>;
}

/**
 * Client-aware MCP transport wrapper
 */
export class ClientAwareMcpTransport implements TrackedMcpTransport {
  constructor(
    private readonly transport: StreamableHTTPTransport,
    private readonly clientExtractor: ClientInfoExtractor,
  ) {}

  /**
   * Handle MCP request with client context isolation
   */
  async handleRequest(ctx: Context<HonoEnv>): Promise<Response> {
    const clientInfo = this.clientExtractor.extractClientInfo(ctx);

    // Use AsyncLocalStorage to provide context without mutation
    return runWithClientContext(clientInfo, async () => {
      const response = await this.transport.handleRequest(ctx);
      if (!response) {
        throw new Error("Transport failed to handle request");
      }
      return response;
    });
  }
}
