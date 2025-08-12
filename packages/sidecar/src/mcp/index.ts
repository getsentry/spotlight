import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { ErrorEvent } from "@sentry/core";
import { z } from "zod";
import { MessageBuffer } from "../messageBuffer.js";
import type { ErrorEventFilter, Payload } from "../utils.js";
import { formatEventOutput } from "./formatting.js";
import { processEnvelope } from "./parsing.js";
import type { ErrorEventSchema } from "./schema.js";

const NO_ERRORS_CONTENT: CallToolResult = {
  content: [
    {
      type: "text",
      text: "No recent errors found in Spotlight. This might be because the application started successfully, but runtime issues only appear when you interact with specific pages or features.\n\nAsk the user to navigate to the page where they're experiencing the issue to reproduce it, that way we can get that in the Spotlight debugger. So if you want to check for errors again, just ask me to do that.",
    },
  ],
};

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
        return NO_ERRORS_CONTENT;
      }

      const content: TextContent[] = [];
      for (const envelope of envelopes) {
        try {
          const formattedErrors = await formatErrorEnvelope(envelope);

          if (formattedErrors?.length) {
            for (const formattedError of formattedErrors) {
              content.push({
                type: "text",
                text: formattedError,
              });
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (content.length === 0) {
        return NO_ERRORS_CONTENT;
      }

      return {
        content,
      };
    },
  );

  mcp.tool(
    "get_specific_error",
    "Fetches a specific error by event ID from Spotlight debugger. Returns error details, stack traces, and request details for immediate debugging context.",
    {
      eventId: z.string(),
    },
    async ({ eventId }) => {
      const envelopes = errorsBuffer.read();

      if (envelopes.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No errors found in Spotlight buffer. The error with ID '${eventId}' may have already been cleared or never captured.`,
            },
          ],
        };
      }

      const content: TextContent[] = [];
      for (const envelope of envelopes) {
        try {
          const formattedErrors = await formatErrorEnvelope(envelope, { eventId });

          if (formattedErrors?.length) {
            for (const formattedError of formattedErrors) {
              content.push({
                type: "text",
                text: formattedError,
              });
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (content.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No error found with ID '${eventId}' in the current Spotlight buffer.`,
            },
          ],
        };
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

async function formatErrorEnvelope([contentType, data]: Payload, filter?: ErrorEventFilter) {
  const { eventId } = filter || {};
  const event = processEnvelope({ contentType, data });

  const {
    envelope: [, items],
  } = event;

  const formattedErrors: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload)) {
      if (eventId && payload.event_id !== eventId) {
        continue;
      }
      formattedErrors.push(formatEventOutput(processErrorEvent(payload)));
    }
  }

  return formattedErrors;
}

function isErrorEvent(payload: unknown): payload is ErrorEvent {
  return typeof payload === "object" && payload !== null && "exception" in payload;
}

export function processErrorEvent(event: ErrorEvent): z.infer<typeof ErrorEventSchema> {
  const entries = [];

  if (event.exception) {
    entries.push({
      type: "exception",
      data: event.exception,
    });
  }

  if (event.request) {
    entries.push({
      type: "request",
      data: event.request,
    });
  }

  if (event.breadcrumbs) {
    entries.push({
      type: "breadcrumbs",
      data: event.breadcrumbs,
    });
  }

  if (event.spans) {
    entries.push({
      type: "spans",
      data: event.spans,
    });
  }

  if (event.threads) {
    entries.push({
      type: "threads",
      data: event.threads,
    });
  }

  return {
    message: event.message ?? "",
    id: event.event_id ?? "",
    type: "error",
    tags: Object.entries(event.tags ?? {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    dateCreated: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
    title: event.message ?? "",
    entries,
    // @ts-expect-error
    contexts: event.contexts,
    platform: event.platform,
  };
}
