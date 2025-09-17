import { randomBytes } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { Connect, ErrorPayload, PluginOption, ViteDevServer } from "vite";
import { setupSidecar } from "./sidecar";

export type SpotlightInitOptions = {
  port?: number;
  sidecarUrl?: string;
};

async function sendErrorToSpotlight(err: ErrorPayload["err"], spotlightUrl = "http://localhost:8969/stream") {
  if (!err.errors) {
    console.log(err);
    return;
  }
  const error = err.errors[0];
  const contextLines = err.pluginCode?.split("\n");
  const errorLine = error.location.lineText;
  const errorLineInContext = contextLines?.indexOf(errorLine);
  const event_id = randomBytes(16).toString("hex");
  const timestamp = new Date();

  const parsedUrl = new URL(spotlightUrl);
  let spotlightErrorStreamUrl: string = spotlightUrl;
  if (!parsedUrl.pathname.endsWith("/stream")) {
    spotlightErrorStreamUrl = new URL("/stream", spotlightUrl).href;
  }

  const envelope = [
    { event_id, sent_at: timestamp.toISOString() },
    { type: "event" },
    {
      event_id,
      level: "error",
      platform: "javascript",
      environment: "development",
      tags: { runtime: "vite" },
      timestamp: timestamp.getTime(),
      exception: {
        values: [
          {
            type: "Error",
            mechanism: {
              type: "instrument",
              handled: false,
            },
            value: error.text,
            stacktrace: {
              frames: [
                error
                  ? {
                      filename: error.location.file,
                      lineno: error.location.line,
                      colno: error.location.column,
                      context_line: errorLine,
                      pre_context: contextLines?.slice(0, errorLineInContext),
                      post_context:
                        errorLineInContext != null && errorLineInContext > -1
                          ? contextLines?.slice(errorLineInContext + 1)
                          : undefined,
                    }
                  : {
                      filename: err.id,
                    },
              ],
            },
          },
        ],
      },
    },
  ]
    .map(p => JSON.stringify(p))
    .join("\n");
  return await fetch(spotlightErrorStreamUrl, {
    method: "POST",
    body: envelope,
    headers: { "Content-Type": "application/x-sentry-envelope" },
  });
}

export default function spotlight(options: SpotlightInitOptions = {}): PluginOption {
  return {
    name: "spotlight",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      setupSidecar({ port: options.port });

      return () =>
        server.middlewares.use(async function viteErrorToSpotlight(
          err: ErrorPayload["err"],
          _req: Connect.IncomingMessage,
          res: ServerResponse,
          next: Connect.NextFunction,
        ) {
          await sendErrorToSpotlight(err, options.sidecarUrl);

          if (res.headersSent) {
            return next(err);
          }
        });
    },
  };
}
