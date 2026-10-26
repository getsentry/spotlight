import { createServer } from "node:http";
import { createNodeTelemetry } from "@spotlightjs/spotlight/sdk/node";

/** Embed the SDK in an HTTP server; the SDK itself does not open a port. */
export function createTelemetryServer() {
  const telemetry = createNodeTelemetry({
    rawBufferSize: 100,
    retention: { maxEnvelopes: 1000, maxAgeMs: 10 * 60 * 1000 },
  });
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      response.setHeader("content-type", "application/json");
      if (request.method === "POST" && url.pathname === "/envelope") {
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const result = await telemetry.ingest({
          body: Buffer.concat(chunks),
          contentType: request.headers["content-type"],
          encoding: request.headers["content-encoding"],
          userAgent: request.headers["user-agent"],
        });
        response.statusCode = result.status === "invalid" ? 400 : 202;
        response.end(JSON.stringify(result));
        return;
      }
      if (request.method === "GET" && url.pathname === "/queries") {
        const traceId = url.searchParams.get("traceId") ?? undefined;
        response.end(JSON.stringify(telemetry.getQuerySummaries({ traceId })));
        return;
      }
      response.statusCode = 404;
      response.end(JSON.stringify({ error: "Not found" }));
    } catch {
      // An aborted request body rejects its async iterator. Keep the server usable.
      if (!response.destroyed) {
        response.statusCode = 400;
        response.end(JSON.stringify({ error: "Could not read request" }));
      }
    }
  });
  server.on("close", telemetry.dispose);
  return { server, telemetry };
}
