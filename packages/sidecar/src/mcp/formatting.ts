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

  // Handle different breadcrumb formats from various Sentry SDKs
  let breadcrumbs: any[] = [];
  const eventBreadcrumbs = event.breadcrumbs as any;
  if (eventBreadcrumbs?.values && Array.isArray(eventBreadcrumbs.values)) {
    breadcrumbs = eventBreadcrumbs.values;
  } else if (Array.isArray(eventBreadcrumbs)) {
    breadcrumbs = eventBreadcrumbs;
  }
  const tags = event.tags || {};
  const extra = event.extra || {};
  const user = event.user || {};
  const contexts = event.contexts || {};

  // Determine error category for better debugging guidance
  const getErrorCategory = () => {
    const platformLower = platform.toLowerCase();
    const errorTypeLower = errorType.toLowerCase();

    if (platformLower.includes("javascript") || platformLower.includes("node")) {
      if (errorTypeLower.includes("syntax")) return "JavaScript Syntax Error";
      if (errorTypeLower.includes("reference")) return "JavaScript Reference Error";
      if (errorTypeLower.includes("type")) return "JavaScript Type Error";
      return "JavaScript Runtime Error";
    }
    if (platformLower.includes("python")) return "Python Error";
    if (platformLower.includes("php")) return "PHP Error";
    if (platformLower.includes("java")) return "Java/Android Error";
    if (errorTypeLower.includes("flutter")) return "Flutter/Dart Error";
    if (errorTypeLower.includes("http")) return "HTTP/Network Error";
    return "General Runtime Error";
  };

  const errorCategory = getErrorCategory();
  const severity =
    level === "fatal" ? "🔴 CRITICAL" : level === "error" ? "🟠 ERROR" : level === "warning" ? "🟡 WARNING" : "🔵 INFO";

  let markdown = `# 🐛 Error Analysis Report

## 📋 Executive Summary
- **Error Category**: ${errorCategory}
- **Severity**: ${severity}
- **Error Type**: \`${errorType}\`
- **Platform**: ${platform}
- **Environment**: ${environment}
- **Timestamp**: ${timestamp}
- **Event ID**: \`${event.event_id || "N/A"}\`

## 🎯 Error Message
\`\`\`
${errorValue}
\`\`\`

## 📍 Primary Error Location`;

  if (culpritFrame) {
    markdown += `
- **File**: \`${culpritFrame.filename || "Unknown"}\`
- **Function**: \`${culpritFrame.function || "Unknown"}\`
- **Line**: ${culpritFrame.lineno || "Unknown"}
- **Column**: ${culpritFrame.colno || "Unknown"}
- **In App Code**: ${culpritFrame.in_app ? "✅ Yes" : "❌ No"}

`;
  } else {
    markdown += `
⚠️ **No specific location identified** - Check full stack trace below

`;
  }

  if (stackTrace.length > 0) {
    const appFrames = stackTrace.filter(frame => frame.in_app);
    const libraryFrames = stackTrace.filter(frame => !frame.in_app);

    markdown += `## 📚 Stack Trace Analysis

### 🎯 Application Code (${appFrames.length} frames)
${
  appFrames.length > 0
    ? appFrames
        .map(frame => {
          const filename = frame.filename || "unknown";
          const func = frame.function || "<anonymous>";
          const line = frame.lineno || "?";
          const col = frame.colno || "?";
          return `- \`${func}\` in \`${filename}:${line}:${col}\``;
        })
        .join("\n")
    : "No application frames found"
}

### 📦 Library/Framework Code (${libraryFrames.length} frames)
<details>
<summary>Click to expand library stack trace</summary>

\`\`\`
${libraryFrames
  .map(frame => {
    const filename = frame.filename || "unknown";
    const func = frame.function || "<anonymous>";
    const line = frame.lineno || "?";
    const col = frame.colno || "?";
    return `  at ${func} (${filename}:${line}:${col})`;
  })
  .join("\n")}
\`\`\`
</details>

`;
  }

  // Enhanced breadcrumbs with categorization
  if (breadcrumbs.length > 0) {
    const recentBreadcrumbs = breadcrumbs.slice(-15);
    const errorBreadcrumbs = recentBreadcrumbs.filter(b => b.level === "error" || b.category === "error");
    const networkBreadcrumbs = recentBreadcrumbs.filter(
      b => b.category === "http" || b.category === "xhr" || b.category === "fetch",
    );
    const userBreadcrumbs = recentBreadcrumbs.filter(
      b => b.category === "ui.click" || b.category === "ui.input" || b.category === "user",
    );

    markdown += `## 🔍 User Journey & Context (Last ${recentBreadcrumbs.length} events)

`;

    if (errorBreadcrumbs.length > 0) {
      markdown += `### ❌ Error Events
${errorBreadcrumbs
  .map(crumb => {
    const timestamp = crumb.timestamp ? new Date(crumb.timestamp * 1000).toISOString() : "Unknown";
    const message = crumb.message || "No message";
    return `- **${timestamp}**: ${message}`;
  })
  .join("\n")}

`;
    }

    if (userBreadcrumbs.length > 0) {
      markdown += `### 👤 User Actions
${userBreadcrumbs
  .map(crumb => {
    const timestamp = crumb.timestamp ? new Date(crumb.timestamp * 1000).toISOString() : "Unknown";
    const message = crumb.message || "No message";
    return `- **${timestamp}**: ${message}`;
  })
  .join("\n")}

`;
    }

    if (networkBreadcrumbs.length > 0) {
      markdown += `### 🌐 Network Activity
${networkBreadcrumbs
  .map(crumb => {
    const timestamp = crumb.timestamp ? new Date(crumb.timestamp * 1000).toISOString() : "Unknown";
    const message = crumb.message || "No message";
    const data = crumb.data ? ` (${JSON.stringify(crumb.data)})` : "";
    return `- **${timestamp}**: ${message}${data}`;
  })
  .join("\n")}

`;
    }

    markdown += `### 📝 All Events
<details>
<summary>Click to expand complete breadcrumb trail</summary>

${recentBreadcrumbs
  .map(crumb => {
    const timestamp = crumb.timestamp ? new Date(crumb.timestamp * 1000).toISOString() : "Unknown";
    const category = crumb.category || "unknown";
    const message = crumb.message || "No message";
    const level = crumb.level || "info";
    const levelIcon = level === "error" ? "❌" : level === "warning" ? "⚠️" : level === "info" ? "ℹ️" : "📝";
    return `- **${timestamp}** ${levelIcon} [${category}]: ${message}`;
  })
  .join("\n")}
</details>

`;
  }

  // Enhanced system context
  if (contexts.browser || contexts.os || contexts.runtime || contexts.device || contexts.app) {
    markdown += `## 💻 System Environment

`;

    if (contexts.device) {
      const device = contexts.device;
      markdown += `### 📱 Device Information
- **Model**: ${device.model || device.name || "Unknown"}
- **Architecture**: ${device.arch || (Array.isArray(device.archs) ? device.archs.join(", ") : device.archs) || "Unknown"}
- **Memory**: ${device.memory_size ? `${Math.round(device.memory_size / 1024 / 1024 / 1024)}GB total` : "Unknown"}
- **Free Memory**: ${device.free_memory ? `${Math.round(device.free_memory / 1024 / 1024 / 1024)}GB free` : "Unknown"}
- **Battery**: ${device.battery_level ? `${device.battery_level}%` : "Unknown"}
- **Orientation**: ${device.orientation || "Unknown"}
- **Simulator**: ${device.simulator ? "✅ Yes" : "❌ No"}

`;
    }

    if (contexts.os) {
      const os = contexts.os;
      markdown += `### 🖥️ Operating System
- **Name**: ${os.name || "Unknown"}
- **Version**: ${os.version || "Unknown"}
- **Build**: ${os.build || "Unknown"}
- **Kernel**: ${os.kernel_version || "Unknown"}

`;
    }

    if (contexts.browser) {
      const browser = contexts.browser;
      markdown += `### 🌐 Browser
- **Name**: ${browser.name || "Unknown"}
- **Version**: ${browser.version || "Unknown"}

`;
    }

    if (contexts.runtime) {
      const runtime = contexts.runtime;
      markdown += `### ⚙️ Runtime Environment
- **Name**: ${runtime.name || "Unknown"}
- **Version**: ${runtime.version || "Unknown"}
- **Compiler**: ${runtime.compiler || "Unknown"}

`;
    }

    if (contexts.app) {
      const app = contexts.app;
      markdown += `### 📱 Application Context
- **Version**: ${app.app_version || "Unknown"}
- **Build**: ${app.app_build || "Unknown"}
- **In Foreground**: ${app.in_foreground ? "✅ Yes" : "❌ No"}
- **Start Time**: ${app.app_start_time || "Unknown"}

`;
    }
  }

  if (event.request) {
    const req = event.request;
    markdown += `## 🌐 Request Context
- **URL**: \`${req.url || "Unknown"}\`
- **Method**: \`${req.method || "Unknown"}\`
- **Query String**: \`${req.query_string || "None"}\`

### Headers
\`\`\`json
${req.headers ? JSON.stringify(req.headers, null, 2) : "None"}
\`\`\`

`;
  }

  if (Object.keys(tags).length > 0) {
    markdown += `## 🏷️ Tags & Metadata
${Object.entries(tags)
  .map(([key, value]) => `- **${key}**: \`${String(value)}\``)
  .join("\n")}

`;
  }

  if (Object.keys(user).length > 0) {
    markdown += `## 👤 User Context
${Object.entries(user)
  .filter(([key]) => key !== "ip_address") // Hide sensitive info
  .map(([key, value]) => `- **${key}**: ${key === "id" ? `\`${value}\`` : value}`)
  .join("\n")}

`;
  }

  if (Object.keys(extra).length > 0) {
    markdown += `## 📊 Additional Debug Data
<details>
<summary>Click to expand additional data</summary>

\`\`\`json
${JSON.stringify(extra, null, 2)}
\`\`\`
</details>

`;
  }

  // Enhanced debugging instructions based on error category
  markdown += `## 🔧 AI Agent Debugging Guide

### 🎯 Immediate Actions Required:
1. **📍 Focus on**: \`${culpritFrame?.filename || "Check stack trace"}\` at line ${culpritFrame?.lineno || "unknown"}
2. **🔍 Error Analysis**: "${errorValue}"
3. **👤 User Context**: Review the user journey above to understand what led to this error
4. **🌐 Environment**: This occurred in **${environment}** environment on **${platform}**

### 🛠️ Platform-Specific Debugging Steps:

`;

  // Add platform-specific debugging guidance
  switch (errorCategory) {
    case "JavaScript Syntax Error":
      markdown += `#### JavaScript Syntax Issues:
- Check for missing semicolons, brackets, or quotes
- Verify proper JSON formatting if parsing JSON
- Look for invalid regular expressions
- Check for reserved keyword usage
- Validate template literal syntax

`;
      break;

    case "JavaScript Reference Error":
      markdown += `#### JavaScript Reference Issues:
- Verify variable declarations and scope
- Check for typos in variable/function names
- Ensure imports/requires are correct
- Validate DOM element selections
- Check for hoisting issues

`;
      break;

    case "JavaScript Type Error":
      markdown += `#### JavaScript Type Issues:
- Check for null/undefined values before method calls
- Verify object properties exist before access
- Validate function parameters and return types
- Check array/object destructuring
- Ensure proper async/await usage

`;
      break;

    case "HTTP/Network Error":
      markdown += `#### Network/HTTP Issues:
- Verify API endpoint URLs and availability
- Check network connectivity and CORS settings
- Validate request headers and authentication
- Review rate limiting and timeout settings
- Check for proper error handling in network calls

`;
      break;

    case "Flutter/Dart Error":
      markdown += `#### Flutter/Dart Issues:
- Check widget tree structure and context usage
- Verify state management and lifecycle methods
- Review async operations and Future handling
- Check for proper disposal of resources
- Validate platform-specific implementations

`;
      break;

    default:
      markdown += `#### General Debugging Steps:
- Review recent code changes in the affected area
- Check for missing dependencies or version conflicts
- Verify configuration files and environment variables
- Test with different input data or user scenarios
- Review logs for additional context

`;
  }

  markdown += `### 🔄 Systematic Investigation:
1. **Reproduce**: Try to reproduce the error using the user journey above
2. **Isolate**: Identify the minimal code path that triggers the error
3. **Validate**: Check inputs, outputs, and state at each step
4. **Test**: Implement fixes and verify with similar scenarios
5. **Monitor**: Set up additional logging/monitoring for this code path

### 📝 Code Review Checklist:
- [ ] Error handling is comprehensive and informative
- [ ] Input validation is present and robust
- [ ] Dependencies are properly managed and up-to-date
- [ ] Code follows platform-specific best practices
- [ ] Similar patterns in codebase are consistent
- [ ] Performance implications are considered
- [ ] Security implications are addressed

---
*Generated by Spotlight Error Formatter - Focus on the error location and user journey for fastest resolution*`;

  return markdown;
}
