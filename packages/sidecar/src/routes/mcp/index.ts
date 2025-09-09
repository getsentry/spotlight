import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { createMcpInstance } from "./mcp.js";

const transport = new StreamableHTTPTransport();
const mcp = createMcpInstance();

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
