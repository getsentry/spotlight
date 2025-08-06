import type { ErrorEvent } from "@sentry/core";

// Language detection mappings
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  ".java": "java",
  ".py": "python",
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".rb": "ruby",
  ".php": "php",
  ".cs": "csharp",
  ".cpp": "cpp",
  ".c": "c",
  ".go": "go",
  ".rs": "rust",
  ".kt": "kotlin",
  ".swift": "swift",
};

const LANGUAGE_MODULE_PATTERNS: Array<[RegExp, string]> = [
  [/^(java\.|com\.|org\.)/, "java"],
  [/^(System\.|Microsoft\.)/, "csharp"],
  [/node_modules/, "javascript"],
  [/\.dart$/, "dart"],
];

/**
 * Detects the programming language of a stack frame
 */
function detectLanguage(frame: any, platform?: string): string {
  // Check filename extensions
  if (frame.filename) {
    const ext = frame.filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext && LANGUAGE_EXTENSIONS[ext]) {
      return LANGUAGE_EXTENSIONS[ext];
    }
  }

  // Check module patterns
  if (frame.module) {
    for (const [pattern, language] of LANGUAGE_MODULE_PATTERNS) {
      if (pattern.test(frame.module)) {
        return language;
      }
    }
  }

  // Platform-based detection
  if (platform) {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes("python")) return "python";
    if (platformLower.includes("java")) return "java";
    if (platformLower.includes("javascript") || platformLower.includes("node")) return "javascript";
    if (platformLower.includes("php")) return "php";
    if (platformLower.includes("csharp") || platformLower.includes("dotnet")) return "csharp";
  }

  return platform || "unknown";
}

/**
 * Renders surrounding source code context for a stack frame with visual indicators
 */
function renderContextLines(frame: any, contextSize = 3): string {
  if (!frame.context || frame.context.length === 0 || !frame.lineno) {
    return "";
  }

  const lines: string[] = [];
  const errorLine = frame.lineno;
  const maxLineNoWidth = Math.max(...frame.context.map(([lineNo]: [number, string]) => lineNo.toString().length));

  for (const [lineNo, code] of frame.context) {
    const isErrorLine = lineNo === errorLine;
    const lineNoStr = lineNo.toString().padStart(maxLineNoWidth, " ");

    if (Math.abs(lineNo - errorLine) <= contextSize) {
      if (isErrorLine) {
        lines.push(`  → ${lineNoStr} │ ${code}`);
      } else {
        lines.push(`    ${lineNoStr} │ ${code}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Get platform-specific exception chain message
 */
function getExceptionChainMessage(platform: string, index: number): string {
  const platformLower = platform.toLowerCase();

  switch (platformLower) {
    case "python":
      return "**During handling of the above exception, another exception occurred:**";
    case "java":
      return "**Caused by:**";
    case "csharp":
    case "dotnet":
      return "**---> Inner Exception:**";
    case "ruby":
      return "**Caused by:**";
    case "go":
      return "**Wrapped error:**";
    case "rust":
      return `**Caused by (${index}):**`;
    default:
      return "**During handling of the above exception, another exception occurred:**";
  }
}

/**
 * Formats variable values for display
 */
function formatVariableValue(value: unknown, maxLength = 80): string {
  try {
    if (typeof value === "string") {
      return `"${value}"`;
    }
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") {
      const stringified = JSON.stringify(value);
      if (stringified.length > maxLength) {
        const truncateAt = maxLength - 6;
        let truncated = stringified.substring(0, truncateAt);
        const lastComma = truncated.lastIndexOf(",");
        if (lastComma > 0) {
          truncated = truncated.substring(0, lastComma);
        }
        return Array.isArray(value) ? `${truncated}, ...]` : `${truncated}, ...}`;
      }
      return stringified;
    }
    return String(value);
  } catch {
    return `<${typeof value}>`;
  }
}

/**
 * Renders a table of local variables
 */
function renderVariablesTable(vars: Record<string, unknown>): string {
  const entries = Object.entries(vars);
  if (entries.length === 0) return "";

  const lines: string[] = ["**Local Variables:**"];
  const lastIndex = entries.length - 1;

  entries.forEach(([key, value], index) => {
    const prefix = index === lastIndex ? "└─" : "├─";
    const valueStr = formatVariableValue(value);
    lines.push(`${prefix} ${key}: ${valueStr}`);
  });

  return lines.join("\n");
}

/**
 * Formats a stack frame according to language conventions
 */
function formatFrameHeader(frame: any, platform?: string): string {
  const language = detectLanguage(frame, platform);

  switch (language) {
    case "java": {
      const className = frame.module || "UnknownClass";
      const method = frame.function || "<unknown>";
      const source = frame.filename || "Unknown Source";
      const location = frame.lineno ? `:${frame.lineno}` : "";
      return `at ${className}.${method}(${source}${location})`;
    }

    case "python": {
      const file = frame.filename || frame.abs_path || frame.module || "<unknown>";
      const func = frame.function || "<module>";
      const line = frame.lineno ? `, line ${frame.lineno}` : "";
      return `  File "${file}"${line}, in ${func}`;
    }

    case "javascript":
    case "typescript": {
      return `${[frame.filename, frame.lineno, frame.colno]
        .filter(i => !!i)
        .join(":")}${frame.function ? ` (${frame.function})` : ""}`;
    }

    case "ruby": {
      const file = frame.filename || frame.module || "<unknown>";
      const func = frame.function ? ` \`${frame.function}\`` : "";
      const line = frame.lineno ? `:${frame.lineno}:in` : "";
      return `    from ${file}${line}${func}`;
    }

    case "php": {
      const file = frame.filename || "<unknown>";
      const line = frame.lineno ? `(${frame.lineno})` : "";
      const func = frame.function || "<unknown>";
      return `${file}${line}: ${func}()`;
    }

    case "csharp": {
      const method = frame.function || "<unknown>";
      const file = frame.filename || "<unknown>";
      const line = frame.lineno ? `:line ${frame.lineno}` : "";
      return `   at ${method} in ${file}${line}`;
    }

    default: {
      const func = frame.function || "<unknown>";
      const location = frame.filename || frame.module || "<unknown>";
      const line = frame.lineno ? `:${frame.lineno}` : "";
      const col = frame.colno != null ? `:${frame.colno}` : "";
      return `    at ${func} (${location}${line}${col})`;
    }
  }
}

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

    // Check for Flutter/Dart first (can be on javascript platform)
    if (
      errorTypeLower.includes("flutter") ||
      (contexts.runtime as any)?.name?.toLowerCase().includes("flutter") ||
      (contexts as any).dart_context ||
      (contexts as any).flutter_context
    ) {
      return "Flutter/Dart Error";
    }

    if (platformLower.includes("javascript") || platformLower.includes("node")) {
      if (errorTypeLower.includes("syntax")) return "JavaScript Syntax Error";
      if (errorTypeLower.includes("reference")) return "JavaScript Reference Error";
      if (errorTypeLower.includes("type")) return "JavaScript Type Error";
      return "JavaScript Runtime Error";
    }
    if (platformLower.includes("python")) return "Python Error";
    if (platformLower.includes("php")) return "PHP Error";
    if (platformLower.includes("java")) return "Java/Android Error";
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

    // Add context lines if available (cast to any to handle different Sentry SDK versions)
    const frameData = culpritFrame as any;
    if (frameData.context?.length) {
      const contextLines = renderContextLines(frameData);
      if (contextLines) {
        markdown += `### 📄 Source Code Context
\`\`\`
${contextLines}
\`\`\`

`;
      }
    }

    // Add variables if available
    if (frameData.vars && Object.keys(frameData.vars).length > 0) {
      markdown += `### 🔍 Local Variables
\`\`\`
${renderVariablesTable(frameData.vars)}
\`\`\`

`;
    }
  } else {
    markdown += `
⚠️ **No specific location identified** - Check full stack trace below

`;
  }

  if (stackTrace.length > 0) {
    const appFrames = stackTrace.filter(frame => frame.in_app);
    const libraryFrames = stackTrace.filter(frame => !frame.in_app);

    // Handle multiple exceptions if present
    const hasMultipleExceptions = event.exception?.values && event.exception.values.length > 1;

    if (hasMultipleExceptions) {
      markdown += `## 📚 Exception Chain Analysis

`;
      // Process exceptions in reverse order (outermost first)
      const allExceptions = [...(event.exception?.values || [])].reverse();

      allExceptions.forEach((exc, index) => {
        if (index > 0) {
          markdown += `${getExceptionChainMessage(platform, index)}

`;
        }

        markdown += `### ${index === 0 ? "Primary" : "Chained"} Exception: \`${exc.type}\`
**Message**: ${exc.value || "No message"}

`;

        if (exc.stacktrace?.frames) {
          const excAppFrames = exc.stacktrace.frames.filter(frame => frame.in_app);
          const excLibFrames = exc.stacktrace.frames.filter(frame => !frame.in_app);

          if (excAppFrames.length > 0) {
            markdown += `**Application Frames:**
${excAppFrames.map(frame => `- ${formatFrameHeader(frame, platform)}`).join("\n")}

`;
          }

          if (excLibFrames.length > 0) {
            markdown += `<details>
<summary>Library frames (${excLibFrames.length})</summary>

\`\`\`
${excLibFrames.map(frame => formatFrameHeader(frame, platform)).join("\n")}
\`\`\`
</details>

`;
          }
        }
      });
    } else {
      markdown += `## 📚 Stack Trace Analysis

### 🎯 Application Code (${appFrames.length} frames)
${
  appFrames.length > 0
    ? appFrames
        .map(frame => {
          const formattedFrame = formatFrameHeader(frame, platform);
          return `- ${formattedFrame}`;
        })
        .join("\n")
    : "No application frames found"
}

### 📦 Library/Framework Code (${libraryFrames.length} frames)
<details>
<summary>Click to expand library stack trace</summary>

\`\`\`
${libraryFrames.map(frame => formatFrameHeader(frame, platform)).join("\n")}
\`\`\`
</details>

`;
    }
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
    const message =
      crumb.message ||
      crumb.data?.label ||
      (crumb.data && typeof crumb.data === "object" ? JSON.stringify(crumb.data) : "") ||
      "No message";
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
- **Memory Usage**: ${app.app_memory ? `${Math.round(app.app_memory / 1024 / 1024)}MB` : "Unknown"}

`;
    }

    // Add performance context if available
    if (contexts.trace || event.spans) {
      markdown += `### ⚡ Performance Context
`;
      if (contexts.trace) {
        const trace = contexts.trace;
        markdown += `- **Trace ID**: \`${trace.trace_id || "Unknown"}\`
- **Span ID**: \`${trace.span_id || "Unknown"}\`
- **Operation**: ${trace.op || "Unknown"}
- **Status**: ${trace.status || "Unknown"}
`;
      }

      if (event.spans && event.spans.length > 0) {
        const slowSpans = event.spans.filter(
          (span: any) => span.timestamp && span.start_timestamp && span.timestamp - span.start_timestamp > 1000, // > 1 second
        );

        if (slowSpans.length > 0) {
          markdown += `- **Slow Operations**: ${slowSpans.length} spans took >1s
`;
        }
      }
      markdown += `
`;
    }
  }

  if (event.request) {
    const req = event.request;
    markdown += `## 🌐 Request Context
- **URL**: \`${req.url || "Unknown"}\`
- **Method**: \`${req.method || "Unknown"}\`
- **Query String**: \`${req.query_string || "None"}\`

`;

    // Parse and display query parameters nicely
    if (req.query_string) {
      try {
        const params = new URLSearchParams(req.query_string);
        const paramEntries = Array.from(params.entries());
        if (paramEntries.length > 0) {
          markdown += `### Query Parameters
${paramEntries.map(([key, value]) => `- **${key}**: \`${value}\``).join("\n")}

`;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // Show important headers only
    if (req.headers) {
      const importantHeaders = ["user-agent", "content-type", "authorization", "x-forwarded-for", "referer"];
      const headers = req.headers as Record<string, string>;
      const filteredHeaders = Object.entries(headers)
        .filter(([key]) => importantHeaders.includes(key.toLowerCase()))
        .reduce(
          (acc, [key, value]) => {
            acc[key] = key.toLowerCase().includes("auth") ? "[REDACTED]" : value;
            return acc;
          },
          {} as Record<string, string>,
        );

      if (Object.keys(filteredHeaders).length > 0) {
        markdown += `### Key Headers
${Object.entries(filteredHeaders)
  .map(([key, value]) => `- **${key}**: \`${value}\``)
  .join("\n")}

`;
      }

      markdown += `<details>
<summary>All Headers</summary>

\`\`\`json
${JSON.stringify(headers, null, 2)}
\`\`\`
</details>

`;
    }
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
- **Widget Context**: Ensure widgets have proper context (common with Scaffold.of(), Theme.of())
- **State Management**: Check setState() calls and widget lifecycle
- **Async Operations**: Verify Future/Stream handling and async/await usage
- **Build Context**: Ensure context is valid when accessing inherited widgets
- **Widget Tree**: Check for proper widget hierarchy and parent-child relationships
- **Platform Channels**: Validate native platform integration if applicable

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
