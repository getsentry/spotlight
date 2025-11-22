import { Hono } from "hono";
import { logger } from "../logger.ts";
import { getRegistry } from "../registry/manager.ts";
import type { InstanceMetadata } from "../registry/types.ts";
import { EventContainer } from "../utils/eventContainer.ts";
import { getBuffer } from "../utils/getBuffer.ts";

const router = new Hono();

/**
 * GET /api/instances
 * List all registered instances with health check
 */
router.get("/", async ctx => {
  try {
    const instances = await getRegistry().list();
    return ctx.json(instances);
  } catch (err) {
    logger.error(`Failed to list instances: ${err}`);
    return ctx.json({ error: "Failed to list instances" }, 500);
  }
});

/**
 * POST /api/instances/ping
 * Receive ping from a new instance and broadcast via SSE
 */
router.post("/ping", async ctx => {
  try {
    const metadata = (await ctx.req.json()) as InstanceMetadata;

    // Validate required fields
    if (!metadata.instanceId || !metadata.port) {
      return ctx.json({ error: "Invalid metadata" }, 400);
    }

    // Broadcast the ping event via existing SSE connection
    const container = new EventContainer("spotlight/instance-ping", Buffer.from(JSON.stringify(metadata)));
    getBuffer().put(container);

    logger.debug(`Received ping from instance ${metadata.instanceId} on port ${metadata.port}`);

    return ctx.body(null, 204);
  } catch (err) {
    logger.error(`Failed to handle instance ping: ${err}`);
    return ctx.json({ error: "Failed to process ping" }, 500);
  }
});

/**
 * POST /api/instances/:id/terminate
 * Terminate a specific instance
 */
router.post("/:id/terminate", async ctx => {
  const instanceId = ctx.req.param("id");

  try {
    const success = await getRegistry().terminate(instanceId);

    if (!success) {
      return ctx.json({ error: "Instance not found or already terminated" }, 404);
    }

    return ctx.json({ success: true });
  } catch (err) {
    logger.error(`Failed to terminate instance ${instanceId}: ${err}`);
    return ctx.json({ error: "Failed to terminate instance" }, 500);
  }
});

/**
 * GET /api/instances/current
 * Get current instance metadata (if this is a registered instance)
 */
router.get("/current", async ctx => {
  try {
    // This endpoint returns metadata for the current sidecar instance
    // For now, we'll return a simple response since we need access to the instance metadata
    // This will be enhanced when we integrate with the server startup
    return ctx.json({ message: "Current instance endpoint not yet implemented" }, 501);
  } catch (err) {
    logger.error(`Failed to get current instance: ${err}`);
    return ctx.json({ error: "Failed to get current instance" }, 500);
  }
});

export default router;
