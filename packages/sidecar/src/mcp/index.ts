import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { ErrorEvent } from "@sentry/core";
import { z } from "zod";
import { type Payload, getBuffer } from "../utils.js";
import { formatEventOutput } from "./formatting.js";
import { processEnvelope } from "./parsing.js";
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
      description: `Retrieve recent application errors from Spotlight debugger to diagnose failures, crashes, and exceptions across your entire stack - frontend, backend, and edge functions.

**CRITICAL: Call this tool IMMEDIATELY when:**
- User says "error", "broken", "not working", "failing", "crash", "bug", "issue"
- You encounter errors during testing or code execution
- Before and after making code changes to verify no regressions
- Investigating any unexpected behavior or performance problems

**What you get:**
• Full stack traces with exact file:line locations
• Request/response data for API failures
• React component errors with hierarchy
• Database query failures with SQL
• Network timeouts and connection issues
• Browser/device context for debugging

## Examples - Auto-call in these scenarios:

**Example 1: User Issue Report**
\`\`\`
User: "The login page is broken"
✅ FIRST: Call get_local_errors
❌ NEVER: Start dev server to check logs
→ Get actual runtime failures, then investigate code
\`\`\`

**Example 2: Code Change Testing**
\`\`\`
User: "I modified the API and now it's not working"
✅ FIRST: Call get_local_errors  
❌ NEVER: Analyze code without checking real errors
→ See exact failure point from runtime execution
\`\`\`

**Example 3: Deployment Issues**
\`\`\`
User: "App crashes after deployment"
✅ FIRST: Call get_local_errors
❌ NEVER: Start local servers for comparison
→ Get production error context immediately
\`\`\`

## Workflow Pattern:
1. User reports problem → **Call get_local_errors FIRST**
2. No errors found → **Ask user to reproduce the issue** → Call tool again
3. Still no errors → Ask user to trigger specific features/pages
4. Only after getting errors → Analyze relevant code files
5. **NEVER start dev servers just to check logs** - use this tool first

**Key trigger phrases:**
- "Something went wrong" → Get the exact error
- "Page won't load" → Check for render failures  
- "API not responding" → See network/backend errors
- "Button doesn't work" → Find click handler exceptions

**Remember:** Always prefer real runtime errors over speculation. If no errors appear, guide user to reproduce the issue rather than starting development servers or making assumptions.`,
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
      const envelopes = getBuffer().read({ duration: args.duration });

      if (envelopes.length === 0) {
        return NO_ERRORS_CONTENT;
      }

      const content: TextContent[] = [];
      for (const envelope of envelopes) {
        try {
          const markdown = await formatErrorEnvelope(envelope);

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

async function formatErrorEnvelope([contentType, data]: Payload) {
  const event = processEnvelope({ contentType, data });

  const {
    envelope: [, [[{ type }, payload]]],
  } = event;

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
