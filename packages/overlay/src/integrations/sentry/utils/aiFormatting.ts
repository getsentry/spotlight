/** *
 * This module provides formatting functions specifically designed for AI consumption,
 * creating structured markdown output that helps AI assistants understand and debug errors.
 *
 * Based on and inspired by the MCP formatting utilities in:
 * packages/sidecar/src/mcp/formatting.ts
 *
 * The formatting approach follows these principles:
 * - Structured markdown for clear AI parsing
 * - Platform-specific stack trace formatting
 * - Enhanced frame analysis with context and variables
 * - Comprehensive error context including breadcrumbs, request info, and metadata
 */

import type { EventFrame, SentryErrorEvent } from "../types";

// Language detection mappings (based on MCP implementation)
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  ".java": "java",
  ".py": "python",
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "javascript",
  ".tsx": "javascript",
  ".rb": "ruby",
  ".php": "php",
};

const LANGUAGE_MODULE_PATTERNS: Array<[RegExp, string]> = [[/^(java\.|com\.|org\.)/, "java"]];

/**
 * Detects the programming language of a stack frame based on the file extension.
 * Falls back to the platform parameter if no filename is available or extension is unrecognized.
 * Based on MCP detectLanguage implementation.
 */
function detectLanguage(frame: EventFrame, platform?: string | null): string {
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

  // Fallback to platform or unknown
  return platform || "unknown";
}

/**
 * Finds the first application frame (in_app) in a stack trace.
 * Searches from the bottom of the stack to find the first frame
 * that belongs to user code rather than libraries.
 */
function findFirstInAppFrame(frames: EventFrame[]): EventFrame | undefined {
  for (let i = frames.length - 1; i >= 0; i--) {
    if (frames[i].in_app === true) {
      return frames[i];
    }
  }
  return undefined;
}

/**
 * Formats a stack frame using platform-specific conventions.
 * Different languages have different standard formats for stack traces.
 * Based on MCP formatFrameHeader implementation with language detection.
 */
function formatFrameForAI(frame: EventFrame, platform?: string | null): string {
  const language = detectLanguage(frame, platform);

  switch (language) {
    case "java": {
      // at com.example.ClassName.methodName(FileName.java:123)
      const className = frame.module || "UnknownClass";
      const method = frame.function || "<unknown>";
      const source = frame.filename || "Unknown Source";
      const location = frame.lineno ? `:${frame.lineno}` : "";
      return `at ${className}.${method}(${source}${location})`;
    }

    case "python": {
      // File "/path/to/file.py", line 42, in function_name
      const file = frame.filename || frame.module || "<unknown>";
      const func = frame.function || "<module>";
      const line = frame.lineno ? `, line ${frame.lineno}` : "";
      return `  File "${file}"${line}, in ${func}`;
    }

    case "ruby": {
      // from /path/to/file.rb:42:in `method_name'
      const file = frame.filename || frame.module || "<unknown>";
      const func = frame.function ? ` \`${frame.function}\`` : "";
      const line = frame.lineno ? `:${frame.lineno}:in` : "";
      return `    from ${file}${line}${func}`;
    }

    case "php": {
      // #0 /path/to/file.php(42): functionName()
      const file = frame.filename || "<unknown>";
      const func = frame.function || "<unknown>";
      const line = frame.lineno ? `(${frame.lineno})` : "";
      return `${file}${line}: ${func}()`;
    }

    default:
      // Original compact format: filename:line:col (function)
      // This preserves backward compatibility for JavaScript and other languages
      return `${[frame.filename, frame.lineno, frame.colno]
        .filter(i => !!i)
        .join(":")}${frame.function ? ` (${frame.function})` : ""}`;
  }
}

/**
 * Renders source code context lines around an error.
 * Shows a window of code with line numbers and highlights the error line.
 * Handles both MCP-style context arrays and Sentry overlay context structure.
 */
function formatContextLines(frame: EventFrame, contextSize = 3): string {
  const lines: string[] = [];
  const errorLine = frame.lineno;

  // Check if frame has MCP-style context array [lineNo, code]
  if ((frame as any).context?.length) {
    const contextLines = (frame as any).context as Array<[number, string]>;
    const maxLineNoWidth = Math.max(...contextLines.map(([lineNo]) => lineNo.toString().length));

    for (const [lineNo, code] of contextLines) {
      const isErrorLine = lineNo === errorLine;
      const lineNoStr = lineNo.toString().padStart(maxLineNoWidth, " ");

      if (Math.abs(lineNo - (errorLine || 0)) <= contextSize) {
        if (isErrorLine) {
          lines.push(`  → ${lineNoStr} │ ${code}`);
        } else {
          lines.push(`    ${lineNoStr} │ ${code}`);
        }
      }
    }
  } else {
    // Handle Sentry overlay context structure (pre_context, context_line, post_context)
    // Add pre-context (lines before the error)
    if (frame.pre_context?.length) {
      frame.pre_context.forEach((line, idx) => {
        const lineNo = errorLine ? errorLine - frame.pre_context!.length + idx : idx;
        lines.push(`    ${lineNo.toString().padStart(4)} │ ${line}`);
      });
    }

    // Add the actual error line with arrow indicator
    if (frame.context_line && errorLine) {
      lines.push(`  → ${errorLine.toString().padStart(4)} │ ${frame.context_line}`);
    }

    // Add post-context (lines after the error)
    if (frame.post_context?.length) {
      frame.post_context.forEach((line, idx) => {
        const lineNo = errorLine ? errorLine + 1 + idx : idx;
        lines.push(`    ${lineNo.toString().padStart(4)} │ ${line}`);
      });
    }
  }

  return lines.join("\n");
}

/**
 * Extracts the context line matching the frame's line number for inline display.
 * This is used in the full stacktrace view to show the actual line of code
 * that caused the error inline with the stack frame.
 * Based on MCP renderInlineContext implementation.
 */
function renderInlineContext(frame: EventFrame): string {
  // Check for MCP-style context array
  if ((frame as any).context?.length) {
    const contextLines = (frame as any).context as Array<[number, string]>;
    const contextLine = contextLines.find(([lineNo]) => lineNo === frame.lineno);
    return contextLine ? `\n${contextLine[1]}` : "";
  }

  // Check for Sentry overlay context_line
  if (frame.context_line && frame.lineno) {
    return `\n${frame.context_line}`;
  }

  return "";
}

/**
 * Formats a variable value for display in the variables table.
 * Handles different types appropriately and safely, converting complex objects
 * to readable representations and handling edge cases like circular references.
 * Based on MCP formatVariableValue implementation.
 */
function formatVariableValue(value: unknown, maxLength = 80): string {
  try {
    if (typeof value === "string") {
      return `"${value}"`;
    }
    if (value === null) {
      return "null";
    }
    if (value === undefined) {
      return "undefined";
    }
    if (typeof value === "object") {
      const stringified = JSON.stringify(value);
      if (stringified.length > maxLength) {
        // Leave room for ", ...]" or ", ...}"
        const truncateAt = maxLength - 6;
        let truncated = stringified.substring(0, truncateAt);

        // Find the last complete element by looking for the last comma
        const lastComma = truncated.lastIndexOf(",");
        if (lastComma > 0) {
          truncated = truncated.substring(0, lastComma);
        }

        // Add the appropriate ending
        if (Array.isArray(value)) {
          return `${truncated}, ...]`;
        }
        return `${truncated}, ...}`;
      }
      return stringified;
    }
    return String(value);
  } catch {
    // Handle circular references or other stringify errors
    return `<${typeof value}>`;
  }
}

/**
 * Formats local variables in a tree-like structure.
 * Uses box-drawing characters for visual hierarchy.
 * Based on MCP renderVariablesTable implementation.
 */
function formatVariablesForAI(vars: Record<string, unknown>): string {
  const entries = Object.entries(vars);
  if (entries.length === 0) return "";

  const lines: string[] = ["Local Variables:"];
  const lastIndex = entries.length - 1;

  entries.forEach(([key, value], index) => {
    const prefix = index === lastIndex ? "└─" : "├─";
    const valueStr = formatVariableValue(value);
    lines.push(`${prefix} ${key}: ${valueStr}`);
  });

  return lines.join("\n");
}

/**
 * Formats a Sentry error event into structured markdown optimized for AI analysis.
 *
 * This function creates comprehensive error reports that include:
 * - Exception details with enhanced stack trace analysis
 * - HTTP request context for web applications
 * - User action breadcrumbs leading to the error
 * - Runtime environment and debugging metadata
 * - Application-specific context and tags
 *
 * The output follows markdown conventions with clear section headers,
 * code blocks for stack traces, and structured data presentation.
 */
export function formatErrorForAI(event: SentryErrorEvent): string {
  const parts: string[] = [];

  // Event header with essential metadata
  parts.push("# Error Report");
  parts.push("");

  if (event.event_id) {
    parts.push(`**Event ID:** ${event.event_id}`);
  }
  if (event.timestamp) {
    const date = new Date(event.timestamp * 1000);
    parts.push(`**Timestamp:** ${date.toISOString()}`);
  }

  // Platform info upfront for context
  if (event.platform) {
    parts.push(`**Platform:** ${event.platform}`);
  }
  if (event.environment) {
    parts.push(`**Environment:** ${event.environment}`);
  }

  parts.push("");

  // Format exception information using enhanced MCP-style formatting
  if (event.exception) {
    if (event.exception.value) {
      const exception = event.exception.value;
      const exceptionTitle = `${exception.type}${exception.value ? `: ${exception.value}` : ""}`;

      parts.push("## Error");
      parts.push("");
      parts.push("```");
      parts.push(exceptionTitle);
      parts.push("```");
      parts.push("");

      // Enhanced frame analysis - show most relevant frame first
      if (exception.stacktrace?.frames) {
        const frames = exception.stacktrace.frames;
        const firstInAppFrame = findFirstInAppFrame(frames);

        // If we have a relevant app frame with context, show it prominently
        if (firstInAppFrame && (firstInAppFrame.context_line || firstInAppFrame.vars)) {
          parts.push("**Most Relevant Frame:**");
          parts.push("─────────────────────");
          parts.push(formatFrameForAI(firstInAppFrame, event.platform));

          // Add context lines if available
          if (firstInAppFrame.context_line || firstInAppFrame.pre_context || firstInAppFrame.post_context) {
            parts.push("");
            parts.push(formatContextLines(firstInAppFrame));
          }

          // Add variables if available
          if (firstInAppFrame.vars && Object.keys(firstInAppFrame.vars).length > 0) {
            parts.push("");
            parts.push(formatVariablesForAI(firstInAppFrame.vars));
          }

          parts.push("");
          parts.push("**Full Stacktrace:**");
          parts.push("────────────────");
        } else {
          parts.push("**Stacktrace:**");
        }

        // Full stack trace in code block with inline context
        parts.push("```");
        parts.push(
          frames
            .map(frame => {
              const header = formatFrameForAI(frame, event.platform);
              const context = renderInlineContext(frame);
              return `${header}${context}`;
            })
            .join("\n"),
        );
        parts.push("```");
      }
    } else if (event.exception.values) {
      // Handle chained exceptions (multiple linked errors)
      const exceptions = event.exception.values;
      [...exceptions].reverse().forEach((exception, index) => {
        if (!exception) return;

        // Add exception chain indicator for subsequent exceptions
        if (index > 0) {
          parts.push("");
          parts.push("**During handling of the above exception, another exception occurred:**");
          parts.push("");
        }

        const exceptionTitle = `${exception.type}${exception.value ? `: ${exception.value}` : ""}`;
        parts.push(index === 0 ? "## Error" : `## ${exceptionTitle}`);
        parts.push("");

        if (index === 0) {
          parts.push("```");
          parts.push(exceptionTitle);
          parts.push("```");
          parts.push("");
        }

        if (exception.stacktrace?.frames) {
          parts.push("**Stacktrace:**");
          parts.push("```");
          parts.push(
            exception.stacktrace.frames
              .map(frame => {
                const header = formatFrameForAI(frame, event.platform);
                const context = renderInlineContext(frame);
                return `${header}${context}`;
              })
              .join("\n"),
          );
          parts.push("```");
        }
      });
    }
  }

  // HTTP Request context (crucial for web app debugging)
  if (event.request && (event.request.method || event.request.url)) {
    parts.push("");
    parts.push("## HTTP Request");
    parts.push("");
    if (event.request.method && event.request.url) {
      parts.push(`**Method:** ${event.request.method}`);
      parts.push(`**URL:** ${event.request.url}`);
    }
    if (event.request.query_string) {
      parts.push(`**Query:** ${event.request.query_string}`);
    }
  }

  // Breadcrumbs - user actions leading to the error (very valuable for debugging)
  const breadcrumbs = Array.isArray(event.breadcrumbs) ? event.breadcrumbs : event.breadcrumbs?.values || [];
  if (breadcrumbs.length > 0) {
    parts.push("");
    parts.push("## User Actions Leading to Error");
    parts.push("");
    const recentBreadcrumbs = breadcrumbs.slice(-5); // Last 5 actions
    recentBreadcrumbs.forEach((breadcrumb, idx) => {
      const timestamp = breadcrumb.timestamp ? new Date((breadcrumb.timestamp as any) * 1000).toString() : "";
      const category = breadcrumb.category || "unknown";
      const message = breadcrumb.message || "";
      const level = (breadcrumb as any).level || "info";

      parts.push(`${idx + 1}. **[${level.toUpperCase()}]** ${category}: ${message}`);
      if (timestamp) {
        parts.push(`   Time: ${timestamp}`);
      }
      if (breadcrumb.data && Object.keys(breadcrumb.data).length > 0) {
        const data = JSON.stringify(breadcrumb.data).slice(0, 150);
        parts.push(`   Data: ${data}`);
      }
      parts.push("");
    });
  }

  // Tags (debugging metadata) - handle both object and array formats
  const tags = event.tags;
  if (tags) {
    let tagEntries: Array<[string, string]> = [];

    // Handle MCP-style array format [{key, value}]
    if (Array.isArray(tags)) {
      tagEntries = tags.map((tag: any) => [tag.key, tag.value]);
    }
    // Handle Sentry overlay object format {key: value}
    else if (typeof tags === "object" && Object.keys(tags).length > 0) {
      tagEntries = Object.entries(tags).map(([key, value]) => [key, String(value)]);
    }

    if (tagEntries.length > 0) {
      parts.push("## Tags");
      parts.push("");
      for (const [key, value] of tagEntries) {
        parts.push(`**${key}**: ${value}`);
      }
      parts.push("");
    }
  }

  // Additional contexts formatted like MCP
  if (event.contexts && Object.keys(event.contexts).length > 0) {
    parts.push("## Additional Context");
    parts.push("");
    parts.push("These are additional context provided by the user when instrumenting their application.");
    parts.push("");

    const contextEntries = Object.entries(event.contexts)
      .map(([name, data]) => {
        if (data && typeof data === "object") {
          const contextData = Object.entries(data as Record<string, unknown>)
            .filter(([key, _]) => key !== "type")
            .map(([key, value]) => `${key}: ${JSON.stringify(value, undefined, 2)}`)
            .join("\n");
          return `**${name}**\n${contextData}`;
        }
        return "";
      })
      .filter(entry => entry.length > 0);

    parts.push(contextEntries.join("\n\n"));
    parts.push("");
  }

  // Extra data (custom application context)
  if (event.extra && Object.keys(event.extra).length > 0) {
    parts.push("## Custom Application Data");
    parts.push("");
    const extraEntries = Object.entries(event.extra).slice(0, 5);
    for (const [key, value] of extraEntries) {
      const valueStr = typeof value === "string" ? value : JSON.stringify(value, undefined, 2);
      parts.push(`**${key}**:`);
      parts.push("```");
      parts.push(valueStr);
      parts.push("```");
      parts.push("");
    }
  }

  // Technical details
  if (event.sdk?.name || event.release) {
    parts.push("## Technical Details");
    parts.push("");
    if (event.sdk?.name) {
      parts.push(`**SDK:** ${event.sdk.name} ${event.sdk.version || ""}`);
    }
    if (event.release) {
      parts.push(`**Release:** ${event.release}`);
    }
    parts.push("");
  }

  return parts.join("\n");
}
