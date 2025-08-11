import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { ErrorEvent, EventItem } from "@sentry/core";
import { z } from "zod";
import { MessageBuffer } from "../messageBuffer.js";
import type { Payload } from "../utils.js";
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
    version: process.env.npm_package_version ?? "dev",
  });

  buffer.subscribe((item: Payload) => {
    try {
      const projectKey = extractProjectId(item) ?? "generic";
      addEnvelopeToProject(projectKey, item);
    } catch (err) {
      console.error(err);
    }
  });

  const PROJECT_BUFFER_LIMIT = 200;
  const projectToEnvelopes = new Map<string, MessageBuffer<Payload>>();

  function addEnvelopeToProject(projectKey: string, payload: Payload) {
    let buf = projectToEnvelopes.get(projectKey);
    if (!buf) {
      buf = new MessageBuffer<Payload>(PROJECT_BUFFER_LIMIT, 60);
      projectToEnvelopes.set(projectKey, buf);
    }
    buf.put(payload);
  }

  function extractProjectId([contentType, data]: Payload): string | undefined {
    const { envelope } = processEnvelope({ contentType, data });
    const items = envelope[1] ?? [];
    for (const item of items) {
      const [, payload] = item;
      if (payload) {
        const { extra } = payload as EventItem[1];
        const wd = extra?.projectId;
        if (wd && typeof wd === "string" && wd.trim().length > 0) {
          return wd;
        }
      }
    }
    return undefined;
  }

  mcp.tool(
    "get_errors",
    "Fetches the most recent errors from Spotlight debugger. Returns error details, stack traces, and request details for immediate debugging context.",
    {
      projects: z.array(z.string()).optional(),
    },
    async (args: { projects?: string[] }, _extra) => {
      const normalizedProjects = Array.isArray(args?.projects)
        ? args.projects.map(p => (typeof p === "string" ? p.trim() : "")).filter(p => p.length > 0)
        : undefined;
      const activeProjects =
        normalizedProjects && normalizedProjects.length > 0 ? new Set(normalizedProjects) : new Set<string>();

      const entries: [number, Payload][] = [];
      const projectBuffers =
        activeProjects.size > 0
          ? [...activeProjects].map(p => projectToEnvelopes.get(p)).filter((b): b is MessageBuffer<Payload> => !!b)
          : [...projectToEnvelopes.values()];
      for (const buf of projectBuffers) {
        entries.push(...buf.readEntries());
      }

      if (entries.length === 0) {
        return NO_ERRORS_CONTENT;
      }

      entries.sort((a, b) => b[0] - a[0]);

      const envelopes = entries.map(([, payload]) => payload);

      const content: TextContent[] = [];
      const seen = new Set<string>();
      for (const envelope of envelopes) {
        try {
          const formattedErrors = formatErrorEnvelope(envelope);

          if (formattedErrors?.length) {
            for (const formattedError of formattedErrors) {
              if (!seen.has(formattedError)) {
                seen.add(formattedError);
                content.push({ type: "text", text: formattedError });
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (content.length === 0) {
        return NO_ERRORS_CONTENT;
      }

      // for (const buf of projectBuffers) {
      //   try {
      //     buf.clear();
      //   } catch {}
      // }

      return { content };
    },
  );

  mcp.tool(
    "list_projects",
    "Lists known projects detected from incoming Sentry envelopes, grouped by projectId (missing paths are grouped under 'generic').",
    async () => {
      const withCounts = [...projectToEnvelopes.entries()].map(
        ([name, buf]) => [name, buf, buf.readEntries().length] as const,
      );
      withCounts.sort((a, b) => b[2] - a[2]);
      const entries = withCounts;

      if (entries.length === 0) {
        return { content: [{ type: "text", text: "No projects detected yet." }] };
      }

      const lines: string[] = [];
      const nameColWidth = Math.max(...entries.map(([name]) => name.length), 7);

      lines.push(`Detected Projects (${entries.length} total)`);
      lines.push("=".repeat(nameColWidth + 12));
      lines.push(`${"Project".padEnd(nameColWidth)} | Entries`);
      lines.push("-".repeat(nameColWidth + 12));

      for (const [project, , count] of entries) {
        lines.push(`${project.padEnd(nameColWidth)} | ${count}`);
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  // TODO: Add tool for performance tracing
  // TODO: Add tool for profiling data

  return mcp;
}

function formatErrorEnvelope([contentType, data]: Payload) {
  const event = processEnvelope({ contentType, data });

  const {
    envelope: [, items],
  } = event;

  const formattedErrors: string[] = [];
  for (const item of items) {
    const [{ type }, payload] = item;

    if (type === "event" && isErrorEvent(payload)) {
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
    dateCreated: event.timestamp
      ? new Date(
          typeof event.timestamp === "number"
            ? event.timestamp < 1e12
              ? event.timestamp * 1000
              : event.timestamp
            : Date.parse(event.timestamp),
        ).toISOString()
      : new Date().toISOString(),
    title: event.message ?? "",
    entries,
    // @ts-expect-error
    contexts: event.contexts,
    platform: event.platform,
  };
}
