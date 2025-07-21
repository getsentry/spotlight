import { Muppet } from "muppet";
import z from "zod";

const mcp = new Muppet({
  name: "spotlight",
  version: "0.0.1",
  prefix: "spotlight_",
});

mcp.tool(
  {
    name: "init",
    description:
      "Add Spotlight.js to the project for issue tracking and debugging. Setup spotlight and then call tools for getting the issues",
    inputSchema: z.object({
      // TODO: Add all the supported project types
      project_type: z.enum(["nextjs"]),
    }),
  },
  () => {
    return {
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
    };
  },
);

mcp.tool(
  {
    name: "get_issues",
    description: "Fetch all logged issues from Spotlight including errors, warnings, and performance metrics",
  },
  () => {
    console.log("This was called! This is the other one!");
    return {
      content: [
        {
          type: "text",
          text: "something",
        },
      ],
    };
  },
);

export default mcp;
