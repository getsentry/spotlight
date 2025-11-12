import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { createMCPInstance } from "../mcp/mcp.ts";

const transport = new StreamableHTTPTransport();
const mcp = createMCPInstance();

const router = new Hono();

router.all(
  "/",
  async (_ctx, next) => {
    if (!mcp.isConnected()) {
      // Connecting the MCP with the transport
      await mcp.connect(transport);
    }

    await next();
  },
  ctx => transport.handleRequest(ctx),
);

export default router;
