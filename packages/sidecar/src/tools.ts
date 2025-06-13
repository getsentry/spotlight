import { createWriteStream } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { createGunzip, createInflate } from "node:zlib";
import launchEditor from "launch-editor";
import { contextLinesHandler } from "./contextlines.js";
import { logger } from "./logger.js";
import type { MessageBuffer } from "./messageBuffer.js";
import { CORS_HEADERS, SPOTLIGHT_HEADERS, error404, error405, getContentType } from "./utils.js";

type Payload = [string, Buffer];
type IncomingPayloadCallback = (body: string) => void;

export const streamRequestHandler = (buffer: MessageBuffer<Payload>, incomingPayload?: IncomingPayloadCallback) => {
  return function handleStreamRequest(
    req: IncomingMessage,
    res: ServerResponse,
    pathname?: string,
    searchParams?: URLSearchParams,
  ): void {
    if (
      req.method === "GET" &&
      req.headers.accept &&
      req.headers.accept === "text/event-stream" &&
      pathname === "/stream"
    ) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.flushHeaders();
      // Send something in the body to trigger the `open` event
      // This is mostly for Firefox -- see getsentry/spotlight#376
      res.write("\n");

      const useBase64 = searchParams?.get("base64") != null;
      const base64Indicator = useBase64 ? ";base64" : "";
      const dataWriter = useBase64
        ? (data: Buffer) => res.write(`data:${data.toString("base64")}\n`)
        : (data: Buffer) => {
            // The utf-8 encoding here is wrong and is a hack as we are
            // sending binary data as utf-8 over SSE which enforces utf-8
            // encoding. This is only for backwards compatibility
            for (const line of data.toString("utf-8").split("\n")) {
              // This is very important - SSE events are delimited by two newlines
              res.write(`data:${line}\n`);
            }
          };
      const sub = buffer.subscribe(([payloadType, data]) => {
        logger.debug("🕊️ sending to Spotlight");
        res.write(`event:${payloadType}${base64Indicator}\n`);
        dataWriter(data);
        // This last \n is important as every message ends with an empty line in SSE
        res.write("\n");
      });

      req.on("close", () => {
        buffer.unsubscribe(sub);
        res.end();
      });
    } else if (req.method === "POST") {
      logger.debug("📩 Received event");
      let stream = req;
      // Check for gzip or deflate encoding and create appropriate stream
      const encoding = req.headers["content-encoding"];
      if (encoding === "gzip") {
        // @ts-ignore
        stream = req.pipe(createGunzip());
      } else if (encoding === "deflate") {
        // @ts-ignore
        stream = req.pipe(createInflate());
      }
      // TODO: Add brotli and zstd support!

      // Read the (potentially decompressed) stream
      const buffers: Buffer[] = [];
      stream.on("readable", () => {
        while (true) {
          const chunk = stream.read();
          if (chunk === null) {
            break;
          }
          buffers.push(chunk);
        }
      });

      stream.on("end", () => {
        const body = Buffer.concat(buffers);
        let contentType = req.headers["content-type"]?.split(";")[0].toLocaleLowerCase();
        if (searchParams?.get("sentry_client")?.startsWith("sentry.javascript.browser") && req.headers.origin) {
          // This is a correction we make as Sentry Browser SDK may send messages with text/plain to avoid CORS issues
          contentType = "application/x-sentry-envelope";
        }
        if (!contentType) {
          logger.warn("No content type, skipping payload...");
        } else {
          buffer.put([contentType, body]);
        }

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
        res.writeHead(200, {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.end();
      });
    } else {
      error405(req, res);
      return;
    }
  };
};

export const fileServer = (filesToServe: Record<string, Buffer>) => {
  return function serveFile(req: IncomingMessage, res: ServerResponse, pathname?: string): void {
    let filePath = `${pathname || req.url}`;
    if (filePath === "/") {
      filePath = "/src/index.html";
    }
    filePath = filePath.slice(1);

    const contentType = getContentType(filePath);

    if (!Object.hasOwn(filesToServe, filePath)) {
      error404(req, res);
    } else {
      res.writeHead(200, {
        // Enable profiling in browser
        "Document-Policy": "js-profiling",
        "Content-Type": contentType,
      });
      res.end(filesToServe[filePath]);
    }
  };
};

export function handleHealthRequest(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    ...CORS_HEADERS,
    ...SPOTLIGHT_HEADERS,
  });
  res.end("OK");
}

export function handleClearRequest(req: IncomingMessage, res: ServerResponse, clearBuffer: () => void): void {
  if (req.method === "DELETE") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
    });
    clearBuffer();
    res.end("Cleared");
  } else {
    error405(req, res);
  }
}

export function openRequestHandler(basePath: string = process.cwd()) {
  return (req: IncomingMessage, res: ServerResponse) => {
    // We're only interested in handling a POST request
    if (req.method !== "POST") {
      res.writeHead(405);
      res.end();
      return;
    }

    let requestBody = "";
    req.on("data", chunk => {
      requestBody += chunk;
    });

    req.on("end", () => {
      const targetPath = resolve(basePath, requestBody);
      logger.debug(`Launching editor for ${targetPath}`);
      launchEditor(
        // filename:line:column
        // both line and column are optional
        targetPath,
        // callback if failed to launch (optional)
        (fileName: string, errorMsg: string) => {
          logger.error(`Failed to launch editor for ${fileName}: ${errorMsg}`);
        },
      );
      res.writeHead(204);
      res.end();
    });
  };
}

// Export all tools as an array for easy server registration
export const tools = [
  {
    route: /^\/health$/,
    handler: handleHealthRequest,
    name: "health",
  },
  {
    route: /^\/stream$|^\/api\/\d+\/envelope\/?$/,
    handler: (buffer: MessageBuffer<Payload>, incomingPayload?: IncomingPayloadCallback) =>
      streamRequestHandler(buffer, incomingPayload),
    name: "stream",
  },
  {
    route: /^\/open$/,
    handler: (basePath?: string) => openRequestHandler(basePath),
    name: "open",
  },
  {
    route: /^\/context-lines$/,
    handler: contextLinesHandler,
    name: "contextLines",
  },
];

// Special tools that need additional configuration
export const createClearHandler = (clearBuffer: () => void) => (req: IncomingMessage, res: ServerResponse) =>
  handleClearRequest(req, res, clearBuffer);

export const createFileServerHandler = (filesToServe: Record<string, Buffer>) => fileServer(filesToServe);
