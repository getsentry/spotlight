import { Muppet } from "muppet";
import z from "zod";
import type { MessageBuffer } from "./messageBuffer.js";
import type { Payload } from "./utils.js";

export function createMcpInstance(buffer: MessageBuffer<Payload>) {
  const mcp = new Muppet({
    name: "spotlight-mcp",
    version: "0.0.1",
  });

  mcp.routes.push({
    type: "middleware",
    name: "*",
    handler: async (c: any, next: any) => {
      console.log(c.message.method, c.message.params.name);
      await next();
    },
  });

  mcp.tool(
    {
      name: "init",
      description:
        "Add Spotlight.js to the project for issue tracking and debugging. Setup spotlight and then call tools for getting the issues",
      inputSchema: z.object({
        // TODO: Add all the supported project types
        framework: z.enum(["nextjs"]),
      }),
    },
    () => ({
      content: [
        {
          type: "text",
          text: `## 1. Check Spotlight Package
- Check if \`@spotlightjs/spotlight\` exists in \`package.json\` dependencies
- If not found: run \`npm install @spotlightjs/spotlight\`

## 2. Check Sentry Package
- Check if \`@sentry/nextjs\` exists in \`package.json\` dependencies
- If not found: run \`npm install @sentry/nextjs\`

## 3. Setup Configuration Files

### Check \`instrumentation-client.js\` (or \`.ts\`)
**If file doesn't exist:** Create it with full Sentry + Spotlight setup:
\`\`\`javascript
import * as Sentry from '@sentry/nextjs';
import * as Spotlight from '@spotlightjs/spotlight';

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE',
});

if (process.env.NODE_ENV === 'development') {
  Spotlight.init();
}
\`\`\`

**If file exists:** Add only these lines:
\`\`\`javascript
import * as Spotlight from '@spotlightjs/spotlight';

if (process.env.NODE_ENV === 'development') {
  Spotlight.init();
}
\`\`\`

### Create \`sentry.server.config.js\` (or \`.ts\`)
\`\`\`javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE',
  spotlight: process.env.NODE_ENV === 'development',
});
\`\`\`

### Create \`sentry.edge.config.js\` (or \`.ts\`)
\`\`\`javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || 'YOUR_SENTRY_DSN_HERE',
  spotlight: process.env.NODE_ENV === 'development',
});
\`\`\`

## 4. Start Sidecar
Run: \`npx @spotlightjs/spotlight\` (in separate terminal)`,
        },
      ],
    }),
  );

  let readerId: string | undefined;
  let issues: Payload[] = [];

  mcp.tool(
    {
      name: "start_listening_issues",
      description: "Start listening for issues from Spotlight. This should run before running the app",
    },
    () => {
      readerId = buffer.subscribe((item: Payload) => {
        issues.push(item);
      });

      return {
        content: [
          {
            type: "text",
            text: "Started listening. You can now run your app and get the issues using the `get_issues` tool. Once the app is running, you should call `get_issues` to fetch the issues.",
          },
        ],
      };
    },
  );

  mcp.tool(
    {
      name: "get_issues",
      description:
        "Get the issues from Spotlight, before running this tool, make sure to call `start_listening_issues` and also run the app so that we can log the issues.",
    },
    async () => {
      if (!readerId) {
        return {
          content: [
            {
              type: "text",
              text: "You need to call `start_listening_issues` before calling this tool.",
            },
          ],
        };
      }

      const _issues = [...issues]; // Copy the issues to avoid mutation during streaming

      // Cleanup
      issues = [];
      // buffer.unsubscribe(readerId);
      // readerId = undefined;

      if (_issues.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No issues found. Make sure to run your app and generate some issues.",
            },
          ],
        };
      }

      return {
        content: _issues.map(([contentType, data]) => ({
          type: "text",
          text: data.toString("utf-8"),
          _meta: {
            contentType,
          },
        })),
      };
    },
  );

  return mcp;
}
