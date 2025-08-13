import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { getBuffer } from "../utils.js";
import { NO_ERRORS_CONTENT, NO_LOGS_CONTENT } from "./constants.js";
import { formatErrorEnvelope, formatLogEnvelope } from "./utils/index.js";

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
            "Look back this many seconds for errors. Use 300+ for broader investigation. Use 30 for recent errors only. For debugging, use 10. For most cases, use 60.",
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

  mcp.registerTool(
    "get_local_logs",
    {
      title: "Get Local App Logs",
      description: `Retrieve recent application logs from Spotlight debugger to monitor behavior, debug issues, and understand application flow across your entire stack - frontend, backend, and edge functions.

**CRITICAL: Call this tool when:**
- Investigating application behavior or flow
- User mentions "logs", "debugging", "trace", "monitoring"
- Understanding what the application is doing under the hood
- Checking for warnings, info messages, or debug output
- After making changes to verify expected behavior
- Troubleshooting performance or unexpected behavior

**What you get:**
• Timestamped log entries with severity levels (info, warn, debug, error)
• Request/response tracking across your stack
• Application state changes and user interactions  
• Database queries and API calls with timing
• Custom debug messages from your code
• Context from client-side, server-side, and edge functions
• Structured attributes for filtering and analysis

## Examples - Auto-call in these scenarios:

**Example 1: Understanding Application Flow**
\`\`\`
User: "Can you help me understand how authentication works?"
✅ FIRST: Call get_local_logs (after user performs login)
❌ NEVER: Just read auth code without seeing runtime flow
→ See actual auth requests, token handling, redirects
\`\`\`

**Example 2: Performance Investigation**
\`\`\`
User: "The page loads slowly"
✅ FIRST: Call get_local_logs 
❌ NEVER: Start analyzing code without runtime data
→ See database queries, API response times, render timing
\`\`\`

**Example 3: Feature Testing**
\`\`\`
User: "I added logging to track user actions"
✅ FIRST: Call get_local_logs (after triggering actions)
→ Verify your logging is working as expected
\`\`\`

## Workflow Pattern:
1. User reports behavior question → **Call get_local_logs** 
2. User tests new feature → **Check logs for expected output**
3. Performance concerns → **Look for timing patterns in logs**
4. Debugging complex flows → **Trace execution through log timeline**
5. **Use with get_local_errors** for complete debugging picture

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
- **ERROR**: Actual failures (also available via get_local_errors)

**Remember:** Logs show you what your application is actually doing, not just what the code says it should do. Use this for understanding real runtime behavior, performance patterns, and verifying that features work as intended.`,
      inputSchema: {
        duration: z
          .number()
          .default(60)
          .describe(
            "Look back this many seconds for errors. Use 300+ for broader investigation. Use 30 for recent errors only. For debugging, use 10. For most cases, use 60.",
          ),
      },
    },
    async args => {
      const envelopes = getBuffer().read({ duration: args.duration });

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
          console.error(err);
        }
      }

      if (content.length === 0) {
        return NO_LOGS_CONTENT;
      }

      return {
        content,
      };
    },
  );

  return mcp;
}
