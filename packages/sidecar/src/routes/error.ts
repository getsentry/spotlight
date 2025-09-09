import { Hono } from "hono";
import { formatEventOutput } from "~/formatting.js";
import { logger } from "~/logger.js";
import { isErrorEvent, processErrorEvent } from "~/processing.js";
import { getBuffer } from "~/utils/index.js";
import { processEnvelope } from "./mcp/parsing.js";

const router = new Hono();

router.get("/", async ctx => {
  const eventId = ctx.req.query("eventId");
  if (!eventId) {
    return ctx.json({ error: "Event ID is required" }, 400);
  }

  try {
    const buffer = getBuffer();
    const envelopes = buffer.getAll();
    let formattedError = null;

    for (const envelope of envelopes) {
      try {
        const parsed = processEnvelope({
          contentType: envelope.getContentType(),
          data: envelope.getData(),
        });

        const [, items] = parsed.envelope;

        for (const item of items) {
          const [{ type }, payload] = item;
          if (type === "event" && isErrorEvent(payload)) {
            const event = payload as any;
            if (event.event_id === eventId) {
              formattedError = formatEventOutput(processErrorEvent(payload));
              break;
            }
          }
        }

        if (formattedError) break;
      } catch (err) {
        logger.warn(`Failed to parse envelope: ${err}`);
      }
    }

    if (!formattedError) {
      return ctx.json({ error: "Event not found" }, 400);
    }

    return ctx.json({
      formattedError,
      eventId,
    });
  } catch (error) {
    logger.error(`Error formatting event: ${error}`);
    return ctx.json({ error: "Failed to format event" }, 400);
  }
});

export default router;
