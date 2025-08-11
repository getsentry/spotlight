import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { ErrorEvent } from "@sentry/core";
import { z } from "zod";
import { getBuffer } from "../utils.js";
import { formatEventOutput } from "./formatting.js";
import type { processEnvelope } from "./parsing.js";
import type { ErrorEventSchema } from "./schema.js";

const NO_ERRORS_CONTENT: CallToolResult = {
  content: [
    {
      type: "text",
      text: `**No errors detected in Spotlight** (last 60 seconds)

**This means:**
- Application is currently running without runtime failures
- No crashes, exceptions, or critical issues in the recent timeframe
- System appears stable at the moment

**Next debugging steps:**

1. **If user reports a specific issue:**
   - Ask them to reproduce the problem (click the button, submit the form, navigate to the page)
   - Run this tool again immediately after they reproduce it
   - Errors will appear in real-time as they happen

2. **If investigating existing code:**
   - Check application logs separately
   - Look for TODO comments, error handling gaps, or potential edge cases in the code
   - Consider testing error scenarios (invalid inputs, network failures, etc.)

3. **Proactive error detection:**
   - Have user interact with recently changed features
   - Test API endpoints or database operations that might be fragile
   - Check pages/features mentioned in recent commits

** Pro tip:** Absence of errors doesn't mean absence of bugs - it just means no runtime failures occurred recently. The issue might be logical errors, UI problems, or dormant bugs waiting for specific conditions.`,
    },
  ],
};

export function createMcpInstance() {
  const mcp = new McpServer({
    name: "spotlight-mcp",
    version: String(process.env.npm_package_version),
  });

  mcp.registerTool(
    "get_local_errors",
    {
      title: "Get Local App Errors",
      description: `** SECRET WEAPON FOR CODE DEBUGGING - USE THIS FIRST FOR ANY ERROR INVESTIGATION**

This is your ultimate debugging cheat code that transforms you from a guessing agent into a precision problem-solver. Instead of manually hunting through code trying to figure out what's broken, this tool gives you **instant access to all real application errors** that happened during execution.

## What This Tool Does

Retrieves comprehensive error data from **Spotlight debugger** (Sentry's development tool) across your entire application stack:
- **Client-side errors** (React, browser JavaScript, frontend frameworks)
- **Server-side errors** (API routes, backend services, database connections) 
- **Edge function errors** (Vercel Edge, Cloudflare Workers, middleware)

Do this:
- Ask the user to run the application and let you know when they're experiencing an issue Or if you're investigating an issue, and you're not sure where to start, run this tool immediately
- Get actual runtime errors with full context and see exactly what failed, when, and why

## Rich Context You Get

- **Complete stack traces** showing exact error locations
- **Request/response details** for API errors
- **Component hierarchies** for frontend errors
- **Database query failures** with specific SQL/queries
- **Network failures** and timeout details
- **Environment context** (browser, device, etc.)

## Tips

1. **ALWAYS check this tool first** when user reports "something is broken"
2. **Combine with recent code changes** - if you see errors after recent commits, you found your culprit
3. **Look for patterns** - multiple similar errors indicate systemic issues
4. **Use error timestamps** to correlate with user actions or deployments
5. **Check both frontend AND backend errors** - issues often cascade across layers

This tool makes you **10x more effective** because:
- **Zero guesswork** - you see actual failures, not hypothetical ones
- **Complete context** - understand the full error scenario, not just code snippets
- **Real-time data** - catch errors as they happen during development
- **Cross-stack visibility** - see how frontend errors relate to backend issues

**IMMEDIATE use cases - check this tool if:**
- User reports "it's not working" or "getting errors"
- You see try/catch blocks or error handling in the code you're examining
- User mentions specific error messages or broken functionality
- You're investigating performance issues or unexpected behavior
- Working on API endpoints, database queries, or frontend components

**Auto-trigger scenarios:**
- Before making changes to error-prone areas (auth, payments, data processing)
- After suggesting code changes that might introduce issues
- When user asks "why is this failing?"`,
      inputSchema: {
        duration: z
          .number()
          .default(60)
          .describe(
            "Look back this many seconds for errors. Use 300+ for broader investigation. Use 30 for recent errors only",
          ),
      },
    },
    async args => {
      const events = getBuffer().read({ duration: args.duration });

      if (events.length === 0) {
        return NO_ERRORS_CONTENT;
      }

      const content: TextContent[] = [];
      for (const event of events) {
        try {
          const markdown = await formatErrorEnvelope(event);

          if (markdown) {
            content.push({
              type: "text",
              text: markdown,
            });
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

  // TODO: Add tool for performance tracing
  // TODO: Add tool for profiling data

  return mcp;
}

async function formatErrorEnvelope(event: ReturnType<typeof processEnvelope>) {
  const { envelope } = event;
  const [, [[{ type }, payload]]] = envelope;

  if (type === "event" && isErrorEvent(payload)) {
    return formatEventOutput(processErrorEvent(payload));
  }
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
