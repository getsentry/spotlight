import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { ErrorEvent } from "@sentry/core";
import { MessageBuffer } from "../messageBuffer.js";
import type { Payload } from "../utils.js";
import { processEnvelope } from "./parsing.js";

export function createMcpInstance(buffer: MessageBuffer<Payload>) {
  const mcp = new McpServer({
    name: "spotlight-mcp",
    version: String(process.env.npm_package_version),
  });

  const errorsBuffer = new MessageBuffer<Payload>(10);
  buffer.subscribe((item: Payload) => {
    errorsBuffer.put(item);
  });

  mcp.tool(
    "get_errors",
    "Fetches the most recent errors from Spotlight debugger. Returns error details, stack traces, and request details for immediate debugging context.",
    async () => {
      const envelopes = errorsBuffer.read();
      errorsBuffer.clear();

      if (envelopes.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No recent errors found in Spotlight. This might be because the application started successfully, but runtime issues only appear when you interact with specific pages or features.\n\nAsk the user to navigate to the page where they're experiencing the issue to reproduce it, that way we can get that in the Spotlight debugger. So if you want to check for errors again, just ask me to do that.",
            },
          ],
        };
      }

      const errors = envelopes
        .map(([contentType, data]) => processEnvelope({ contentType, data }))
        .sort((a, b) => {
          const a_sent_at = a.envelope[0].sent_at as string;
          const b_sent_at = b.envelope[0].sent_at as string;
          if (a_sent_at < b_sent_at) return 1;
          if (a_sent_at > b_sent_at) return -1;
          return 0;
        });

      const content: TextContent[] = [];
      for (const error of errors) {
        const {
          envelope: [, [[{ type }, payload]]],
        } = error;

        if (type === "event" && isErrorEvent(payload)) {
          content.push({
            type: "text",
            text: JSON.stringify({
              exception: payload.exception,
              level: payload.level,
              request: payload.request,
            }),
          });
        }
      }

      return {
        content,
      };
    },
  );

  // TODO: Add tool for performance tracing
  // TODO: Add tool for profiling data

  return mcp;
}

function isErrorEvent(payload: unknown): payload is ErrorEvent {
  return typeof payload === "object" && payload !== null && "exception" in payload;
}
