import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { captureException, wrapMcpServerWithSentry } from "@sentry/node";
import { z } from "zod";
import { formatErrorEnvelope } from "../formatters/md/errors.ts";
import { formatLogEnvelope } from "../formatters/md/logs.ts";
import {
  buildSpanTree,
  extractTracesFromEnvelopes,
  formatTraceSummary,
  renderSpanTree,
} from "../formatters/md/traces.ts";
import { getBuffer } from "../utils/index.ts";
import { NO_ERRORS_CONTENT, NO_LOGS_CONTENT } from "./constants.ts";

const inputSchema = {
  filters: z.union([
    z.object({
      timeWindow: z
        .number()
        .describe(
          "Number of seconds to look back from now. Examples: 60 = last minute, 300 = last 5 minutes, 3600 = last hour. Default: 60",
        ),
    }),
    z.object({
      filename: z
        .string()
        .describe(
          "Exact filename to search in stack traces or logs. Examples: 'Button.tsx', 'auth.js', 'api/routes.ts'. Case-sensitive.",
        ),
    }),
    /**
     * TODO: Need to check, if this approach is better then a cursor based approach,
     * where the user can pass `events since [event_id]` as "last N events" is a
     * moving target as events keep coming in.
     *
     * https://github.com/getsentry/spotlight/pull/968#discussion_r2391587907
     */
    z
      .object({
        limit: z.number().describe("Maximum number of results to return. Examples: 10, 20, 50. Default: no limit"),
        offset: z
          .number()
          .default(0)
          .describe(
            "Number of results to skip from the beginning. Examples: 0 = start from first, 10 = skip first 10. Default: 0",
          ),
      })
      .optional()
      .describe("Pagination: Use when timeWindow doesn't work or for browsing through many results"),
  ]),
};

export type InputSchema = { [K in keyof typeof inputSchema]: z.infer<(typeof inputSchema)[K]> };

function applyPagination<T>(envelopes: T[], pagination: InputSchema["filters"]) {
  if (pagination == null || !("limit" in pagination)) {
    return envelopes;
  }

  return envelopes.slice(pagination.offset, pagination.offset + pagination.limit);
}

export function createMCPInstance() {
  const mcp = wrapMcpServerWithSentry(
    new McpServer({
      name: "spotlight-mcp",
      version: String(process.env.npm_package_version),
    }),
  );

  mcp.registerTool(
    "search_errors",
    {
      title: "Search Application Errors",
      description: `**Purpose:** Search for runtime errors, exceptions, and crashes captured by Spotlight across your entire application stack.

**CRITICAL: Call this tool IMMEDIATELY when:**
- User says "error", "broken", "not working", "failing", "crash", "bug", "issue"
- You encounter errors during testing or code execution
- Before and after making code changes to verify no regressions
- Investigating any unexpected behavior or performance problems
- Error messages and exception details
- Request/response context for API failures
- Browser/device info when available

**Returns:**
• Full stack traces with exact file:line locations

**When to use:**
- User reports "error", "broken", "not working", "crash", "bug"
- After code changes to verify no regressions
- Investigating unexpected behavior or failures
- Debugging specific file errors

**Example calls:**
\`\`\`json
// Example 1: Check last minute for any errors
search_errors({ filters: { timeWindow: 60 } })

// Example 2: Find errors in specific file
search_errors({ filters: { filename: "auth.tsx" } })

// Example 3: Get last 10 errors with pagination
search_errors({ filters: { limit: 10, offset: 0 } })
\`\`\`

**Parameter hints:**
• filters.timeWindow: Seconds to look back (60 = 1 min, 300 = 5 min, 3600 = 1 hour)
• filters.filename: Exact filename in stack trace (e.g., "Button.tsx", "api.js")
• filters.limit/offset: For pagination through many errors`,
      inputSchema,
    },
    async args => {
      const envelopes = getBuffer().read(args.filters);

      if (envelopes.length === 0) {
        return NO_ERRORS_CONTENT;
      }

      const content: TextContent[] = [];
      for (const envelope of envelopes) {
        try {
          const events = await formatErrorEnvelope(envelope);

          if (events?.length) {
            for (const event of events) {
              content.push({
                type: "text",
                text: event,
              });
            }
          }
        } catch (err) {
          captureException(err, { extra: { context: "Error formatting error envelope in MCP" } });
        }
      }

      if (content.length === 0) {
        return NO_ERRORS_CONTENT;
      }

      return {
        content: applyPagination(content, args.filters),
      };
    },
  );

  mcp.registerTool(
    "search_logs",
    {
      title: "Search Application Logs",
      description: `**Purpose:** Search for application logs to understand behavior, debug issues, and trace execution flow across your stack.

**NOT for:** Error diagnostics (use search_errors for exceptions/crashes). This tool is for info, warn, debug, and trace messages.

**Returns:**
• Timestamped log entries with severity levels (info, warn, debug)
• Custom application messages and debug output
• API request/response logs with timing
• Database query logs and performance metrics

**When to use:**
- Understanding application flow and behavior
- User mentions "logs", "debugging", "trace"
- Checking what the app is doing internally
- Performance investigation and timing analysis

**Example calls:**
\`\`\`json
// Example 1: Check last 5 minutes of logs
search_logs({ filters: { timeWindow: 300 } })

// Example 2: Find logs from specific file
search_logs({ filters: { filename: "auth.ts" } })

// Example 3: Get recent 20 log entries
search_logs({ filters: { limit: 20, offset: 0 } })
\`\`\`

## Workflow Pattern:
1. User reports behavior question → **Call search_logs** 
2. User tests new feature → **Check logs for expected output**
3. Performance concerns → **Look for timing patterns in logs**
4. Debugging complex flows → **Trace execution through log timeline**
5. **Use with search_errors** for complete debugging picture

**Key trigger phrases:**
- "How does X work?" → See runtime execution flow
- "Is the app doing Y?" → Check for specific log patterns  
- "Performance seems off" → Look for timing/resource logs
- "Debug this feature" → Follow execution path through logs
- "What's happening when..." → Real-time application behavior

**Log Levels Available:**
- **INFO**: General application flow and significant events
- **WARN**: Potential issues that don't break functionality  
- **DEBUG**: Detailed execution information for troubleshooting
- **ERROR**: Actual failures (also available via search_errors)

**Remember:** Logs show you what your application is actually doing, not just what the code says it should do. Use this for understanding real runtime behavior, performance patterns, and verifying that features work as intended.

**Parameter hints:**
• filters.timeWindow: Seconds to look back (60 = 1 min, 300 = 5 min, 3600 = 1 hour) 
• filters.filename: Exact filename generating logs (e.g., "api.ts", "database.js")
• filters.limit/offset: For pagination through many log entries`,
      inputSchema,
    },
    async args => {
      const envelopes = getBuffer().read(args.filters);

      if (envelopes.length === 0) {
        return NO_LOGS_CONTENT;
      }

      const content: TextContent[] = [];
      for (const envelope of envelopes) {
        try {
          const events = await formatLogEnvelope(envelope);

          if (events?.length) {
            for (const event of events) {
              content.push({
                type: "text",
                text: event,
              });
            }
          }
        } catch (err) {
          captureException(err, { extra: { context: "Error formatting log envelope in MCP" } });
        }
      }

      if (content.length === 0) {
        return NO_LOGS_CONTENT;
      }

      return {
        content: applyPagination(content, args.filters),
      };
    },
  );

  mcp.registerTool(
    "search_traces",
    {
      title: "Search Performance Traces",
      description: `**Purpose:** Search for performance traces to identify slow requests, bottlenecks, and transaction patterns across your application.

**USE THIS TOOL WHEN:**
- Investigating application performance and request flows
- User mentions "traces", "performance", "slow requests", "tracing"
- Looking for distributed tracing data or transaction flows
- Need to see high-level trace patterns before diving into details

**Returns:**
• List of traces with IDs, durations, and span counts
• Root transaction names and total execution time
• Error counts per trace for quick identification
• Trace start timestamps for timeline analysis

**When to use:**
- Investigating performance issues or slow requests
- User mentions "traces", "performance", "slow"
- Finding specific transactions or requests
- Overview of recent application activity

**Example calls:**
\`\`\`json
// Example 1: Get traces from last 5 minutes
search_traces({ filters: { timeWindow: 300 } })

// Example 2: Get 10 most recent traces
search_traces({ filters: { limit: 10, offset: 0 } })

// Example 3: Find traces involving specific file
search_traces({ filters: { filename: "api.ts" } })
\`\`\`

**Parameter hints:**
• filters.timeWindow: Seconds to look back (60 = 1 min, 300 = 5 min)
• filters.limit: Number of traces to return (e.g., 10, 20)
• filters.offset: Skip first N traces for pagination
**Key trigger phrases:**
- "Show me recent traces" → Get trace overview
- "Performance issues" → Look for slow traces
- "Request flows" → See transaction patterns
- "Distributed tracing" → View trace summaries

**Next step:** Use get_traces with a trace ID to see detailed span breakdown`,
      inputSchema,
    },
    async args => {
      const envelopes = getBuffer().read(args.filters);

      if (envelopes.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No traces found in the specified time period. Make sure your application is instrumented with Sentry performance monitoring and try triggering some requests or transactions.",
            },
          ],
        };
      }

      const traces = extractTracesFromEnvelopes(envelopes);

      if (traces.size === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No traces with trace context found. Ensure your Sentry SDK has performance monitoring enabled and is generating transaction events.",
            },
          ],
        };
      }

      let content: TextContent[] = [];

      // Sort traces by start time (most recent first)
      const sortedTraces = Array.from(traces.values()).sort(
        (a, b) => (b.start_timestamp || 0) - (a.start_timestamp || 0),
      );

      content.push({
        type: "text",
        text: `# Local Traces (${sortedTraces.length} found)\n\nRecent traces from your application:\n`,
      });

      for (const trace of sortedTraces.slice(0, 20)) {
        // Limit to 20 most recent
        content.push({
          type: "text",
          text: formatTraceSummary(trace),
        });
      }

      content = applyPagination(content, args.filters);

      content.push({
        type: "text",
        text: "\n**Next Steps:**\nUse `get_traces` with a trace ID (e.g., first 8 characters shown above) to see the full span tree and detailed timing breakdown for any specific trace.",
      });

      return { content };
    },
  );

  mcp.registerTool(
    "get_traces",
    {
      title: "Get Trace Details",
      description: `**Purpose:** Get the complete span tree and timing breakdown for a specific trace ID to analyze performance bottlenecks.

**USE THIS TOOL WHEN:**
- User provides a specific trace ID from \`search_traces\`
- Want to see detailed span hierarchy and timing for a trace
- Investigating performance bottlenecks within a specific request flow
- Need to understand the complete execution path of a transaction

**Returns:**
• Hierarchical span tree with parent-child relationships
• Individual span durations and operation names
• Database queries, API calls, and render timings
• Error details if spans failed

**When to use:**
- After finding a trace ID with search_traces
- Investigating specific slow request or transaction
- Understanding detailed execution flow
- Finding performance bottlenecks in a trace

**Example calls:**
\`\`\`json
// Example 1: Get trace using short ID (first 8 chars)
get_traces({ traceId: "71a8c5e4" })

// Example 2: Get trace using full 32-char ID
get_traces({ traceId: "71a8c5e41ae1044dee67f50a07538fe7" })
\`\`\`

**Parameter hints:**
• traceId: Trace identifier from search_traces
  - Can use first 8 characters (e.g., "71a8c5e4")
  - Or full 32-character hex string
  - Case-insensitive`,
      inputSchema: {
        traceId: z
          .string()
          .describe(
            "Trace ID to retrieve. Format: 8 or 32 hex characters. Examples: '71a8c5e4' or '71a8c5e41ae1044dee67f50a07538fe7'",
          ),
      },
    },
    async args => {
      // Getting all the envelopes
      const envelopes = getBuffer().read({ all: true });
      const traces = extractTracesFromEnvelopes(envelopes);

      // Find trace by full ID or partial ID match
      let targetTrace = traces.get(args.traceId);

      if (!targetTrace && args.traceId.length < 32) {
        // Try to find by partial ID
        for (const [traceId, trace] of traces) {
          if (traceId.startsWith(args.traceId)) {
            targetTrace = trace;
            break;
          }
        }
      }

      if (!targetTrace) {
        return {
          content: [
            {
              type: "text",
              text: `Trace \`${args.traceId}\` not found. Use \`search_traces\` to see available traces, or try expanding the time window if the trace is older.`,
            },
          ],
        };
      }

      const spanTree = buildSpanTree(targetTrace);

      // Just render the full span tree
      const treeLines = renderSpanTree(spanTree);

      return {
        content: [
          {
            type: "text",
            text: treeLines.join("\n"),
          },
        ],
      };
    },
  );

  return mcp;
}
