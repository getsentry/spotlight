import { createWriteStream } from "node:fs";
import { Hono } from "hono";
import { SENTRY_CONTENT_TYPE } from "../../../shared/constants.ts";
import { logger } from "../../logger.ts";
import { decompressBody, pushToSpotlightBuffer } from "../../sdk.ts";
import type { ContentEncoding } from "../../sdk.ts";
import type { HonoEnv } from "../../types/env.ts";
import { getBuffer } from "../../utils/index.ts";
import { logIncomingEvent, logOutgoingEvent } from "./debugLogging.ts";
import { streamSSE } from "./streaming.ts";
import { parseBrowserFromUserAgent } from "./userAgent.ts";

const router = new Hono<HonoEnv>()
  .get("/stream", ctx => {
    const buffer = getBuffer();

    const useBase64 = ctx.req.query("base64") != null;
    const base64Indicator = useBase64 ? ";base64" : "";

    // Capture client information for debug logging
    let clientId = ctx.req.query("client");
    if (!clientId) {
      // Fallback to parsing User-Agent if no client param
      const userAgent = ctx.req.header("User-Agent") || "unknown";
      clientId = parseBrowserFromUserAgent(userAgent);
    }
    // Sanitize to prevent log injection - keep only safe printable characters
    // Allow alphanumeric, spaces, dots, dashes, underscores, slashes, parentheses
    clientId = clientId.replace(/[^\w\s.\-/()]/g, "");
    // Ensure we always have a non-empty clientId
    if (!clientId) clientId = "unknown";

    return streamSSE(ctx, async stream => {
      // Check for Last-Event-ID header to support reconnection
      const lastEventId = ctx.req.header("Last-Event-ID");

      // Subscribe to events, optionally starting from after the lastEventId
      const sub = buffer.subscribe(container => {
        logOutgoingEvent(container, clientId);

        const parsedEnvelope = container.getParsedEnvelope();
        if (parsedEnvelope) {
          stream.writeSSE({
            id: parsedEnvelope.envelope[0].__spotlight_envelope_id.toString(),
            event: `${container.getContentType()}${base64Indicator}`,
            data: JSON.stringify(parsedEnvelope.envelope),
          });
        }
      }, lastEventId);

      stream.onAbort(() => {
        buffer.unsubscribe(sub);
      });
    });
  })
  .get("/envelope/:id", ctx => {
    const buffer = getBuffer();

    const envelopeId = ctx.req.param("id");
    const container = buffer.read({ envelopeId });

    if (container.length === 0) {
      return ctx.notFound();
    }

    return ctx.body(new Uint8Array(container[0].getData()), 200, {
      "Content-Type": container[0].getContentType(),
      "Cache-Control": "no-cache",
      "Content-Disposition": `attachment; filename="${envelopeId}.bin"`,
      Connection: "keep-alive",
    });
  })
  .on("POST", ["/stream", "/api/:id/envelope"], async ctx => {
    let contentType = ctx.req.header("content-type")?.split(";")[0].toLocaleLowerCase();
    if (ctx.req.query("sentry_client")?.startsWith("sentry.javascript.browser") && ctx.req.header("Origin")) {
      // This is a correction we make as Sentry Browser SDK may send messages with text/plain to avoid CORS issues
      contentType = SENTRY_CONTENT_TYPE;
    }

    // manually decompress body to use it below without another decompression
    const body = decompressBody(
      Buffer.from(await ctx.req.arrayBuffer()),
      ctx.req.header("Content-Encoding") as ContentEncoding,
    );

    const container = pushToSpotlightBuffer({
      body,
      spotlightBuffer: getBuffer(),
      contentType,
      userAgent: ctx.req.header("User-Agent"),
    });

    if (container) {
      // Log incoming event details when debug is enabled
      logIncomingEvent(container);
    } else {
      logger.warn("No content type, skipping payload...");
    }

    const incomingPayload = ctx.get("incomingPayload");

    if (process.env.SPOTLIGHT_CAPTURE || incomingPayload) {
      const contentType = container?.getContentType();
      const timestamp = BigInt(Date.now()) * 1_000_000n + (process.hrtime.bigint() % 1_000_000n);
      const filename = `${contentType?.replace(/[^a-z0-9]/gi, "_") || "no_content_type"}-${timestamp}.txt`;

      if (incomingPayload) {
        incomingPayload(body.toString("binary"));
      } else {
        const stream = createWriteStream(filename);
        stream.on("error", err => {
          logger.error(`Failed to save data to ${filename}: ${err}`);
          stream.destroy();
        });
        stream.end(body, () => {
          logger.info(`🗃️ Saved data to ${filename}`);
        });
      }
    }

    // 204 would be more appropriate but returning 200 to match what /envelope returns
    return ctx.body(null, 200, {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
  });

export default router;
