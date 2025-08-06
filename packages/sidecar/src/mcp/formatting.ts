import type { ErrorEvent } from "@sentry/core";

export function formatIssue(event: ErrorEvent): string {
  const timestamp = event.timestamp ? new Date(event.timestamp * 1000).toISOString() : "Unknown";
  const level = event.level || "error";
  const platform = event.platform || "unknown";
  const environment = event.environment || "unknown";

  const exception = event.exception?.values?.[0];
  const errorType = exception?.type || "Unknown Error";
  const errorValue = exception?.value || "No error message available";

  const stackTrace = exception?.stacktrace?.frames || [];
  const culpritFrame = stackTrace.find(frame => frame.in_app) || stackTrace[stackTrace.length - 1];

  const breadcrumbs = event.breadcrumbs || [];
  const tags = event.tags || {};
  const extra = event.extra || {};
  const user = event.user || {};
  const contexts = event.contexts || {};

  let markdown = `# Error Report

## Summary
- **Error Type**: ${errorType}
- **Message**: ${errorValue}
- **Level**: ${level.toUpperCase()}
- **Platform**: ${platform}
- **Environment**: ${environment}
- **Timestamp**: ${timestamp}
- **Event ID**: ${event.event_id || "N/A"}

## Error Details
\`\`\`
${errorValue}
\`\`\`

`;

  if (culpritFrame) {
    markdown += `## Primary Location
- **File**: ${culpritFrame.filename || "Unknown"}
- **Function**: ${culpritFrame.function || "Unknown"}
- **Line**: ${culpritFrame.lineno || "Unknown"}
- **Column**: ${culpritFrame.colno || "Unknown"}

`;
  }

  if (stackTrace.length > 0) {
    markdown += `## Stack Trace
\`\`\`
${stackTrace
  .map(frame => {
    const filename = frame.filename || "unknown";
    const func = frame.function || "<anonymous>";
    const line = frame.lineno || "?";
    const col = frame.colno || "?";
    return `  at ${func} (${filename}:${line}:${col})`;
  })
  .join("\n")}
\`\`\`

`;
  }

  if (breadcrumbs.length > 0) {
    markdown += `## Breadcrumbs (Last ${Math.min(breadcrumbs.length, 10)} actions)
${breadcrumbs
  .slice(-10)
  .map(crumb => {
    const timestamp = crumb.timestamp ? new Date(crumb.timestamp * 1000).toISOString() : "Unknown";
    const category = crumb.category || "unknown";
    const message = crumb.message || "No message";
    const level = crumb.level || "info";
    return `- **${timestamp}** [${level.toUpperCase()}] ${category}: ${message}`;
  })
  .join("\n")}

`;
  }

  if (Object.keys(tags).length > 0) {
    markdown += `## Tags
${Object.entries(tags)
  .map(([key, value]) => `- **${key}**: ${String(value)}`)
  .join("\n")}

`;
  }

  if (Object.keys(user).length > 0) {
    markdown += `## User Information
${Object.entries(user)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join("\n")}

`;
  }

  if (contexts.browser || contexts.os || contexts.runtime) {
    markdown += `## System Context
`;
    if (contexts.browser) {
      const browser = contexts.browser;
      markdown += `### Browser
- **Name**: ${browser.name || "Unknown"}
- **Version**: ${browser.version || "Unknown"}

`;
    }

    if (contexts.os) {
      const os = contexts.os;
      markdown += `### Operating System
- **Name**: ${os.name || "Unknown"}
- **Version**: ${os.version || "Unknown"}

`;
    }

    if (contexts.runtime) {
      const runtime = contexts.runtime;
      markdown += `### Runtime
- **Name**: ${runtime.name || "Unknown"}
- **Version**: ${runtime.version || "Unknown"}

`;
    }
  }

  if (event.request) {
    const req = event.request;
    markdown += `## Request Information
- **URL**: ${req.url || "Unknown"}
- **Method**: ${req.method || "Unknown"}
- **Headers**: ${req.headers ? JSON.stringify(req.headers, null, 2) : "None"}

`;
  }

  if (Object.keys(extra).length > 0) {
    markdown += `## Additional Data
\`\`\`json
${JSON.stringify(extra, null, 2)}
\`\`\`

`;
  }

  markdown += `## Debugging Instructions for AI Agent

### Priority Actions:
1. **Examine the primary error location**: ${culpritFrame?.filename || "Check stack trace"}:${culpritFrame?.lineno || "?"}
2. **Review the error message**: "${errorValue}"
3. **Check recent user actions** in the breadcrumbs section above
4. **Verify system compatibility** using the context information

### Common Resolution Steps:
- Check for null/undefined values at the error location
- Verify API responses and network requests
- Review recent code changes around the error location
- Check for missing dependencies or imports
- Validate user input and data types
- Review error handling and try-catch blocks

### Investigation Questions:
- Is this error reproducible?
- What user actions led to this error?
- Are there similar errors in the logs?
- Has this code path been recently modified?
`;

  return markdown;
}
