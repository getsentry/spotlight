import { createWriteStream } from "node:fs";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { Hono } from "hono";
import { logger } from "~/logger.js";
import type { HonoEnv } from "~/types/env.js";
import { EventContainer, getBuffer } from "~/utils/index.js";
import { logIncomingEvent, logOutgoingEvent } from "./debugLogging.js";
import { streamSSE } from "./streaming.js";
import { parseBrowserFromUserAgent } from "./userAgent.js";

const decompressors: Record<string, ((buf: Buffer) => Buffer) | undefined> = {
  gzip: gunzipSync,
  deflate: inflateSync,
  br: brotliDecompressSync,
};

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
    const arrayBuffer = await ctx.req.arrayBuffer();
    let body: Buffer = Buffer.from(arrayBuffer);

    // Check for gzip or deflate encoding and create appropriate stream
    const encoding = ctx.req.header("Content-Encoding");
    const decompressor = decompressors[encoding ?? ""];
    if (decompressor) {
      body = decompressor(body);
    }

    let contentType = ctx.req.header("content-type")?.split(";")[0].toLocaleLowerCase();
    if (ctx.req.query("sentry_client")?.startsWith("sentry.javascript.browser") && ctx.req.header("Origin")) {
      // This is a correction we make as Sentry Browser SDK may send messages with text/plain to avoid CORS issues
      contentType = "application/x-sentry-envelope";
    }

    if (!contentType) {
      logger.warn("No content type, skipping payload...");
    } else {
      // Create event container and add to buffer
      const senderUserAgent = ctx.req.header("User-Agent");
      const container = new EventContainer(contentType, body, senderUserAgent);

      // Log incoming event details when debug is enabled
      logIncomingEvent(container);

      // Add to buffer - this will automatically trigger all subscribers
      // including the onEnvelope callback if one is registered
      getBuffer().put(container);
    }

    const incomingPayload = ctx.get("incomingPayload");

    if (process.env.SPOTLIGHT_CAPTURE || incomingPayload) {
      const timestamp = BigInt(Date.now()) * 1_000_000n + (process.hrtime.bigint() % 1_000_000n);
      const filename = `${contentType?.replace(/[^a-z0-9]/gi, "_") || "no_content_type"}-${timestamp}.txt`;

      if (incomingPayload) {
        incomingPayload(body.toString("binary"));
      } else {
        try {
          createWriteStream(filename).write(body);
          logger.info(`🗃️ Saved data to ${filename}`);
        } catch (err) {
          logger.error(`Failed to save data to ${filename}: ${err}`);
        }
      }
    }

    // 204 would be more appropriate but returning 200 to match what /envelope returns
    return ctx.body(null, 200, {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
  });

export default router;
