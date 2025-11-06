import type { Envelope } from "@sentry/core";
import chalk from "chalk";
import { parseBrowserFromUserAgent } from "~/routes/stream/userAgent.js";

/**
 * Helper to detect if a User-Agent string is from a browser
 */
function isBrowserUserAgent(userAgent: string): boolean {
  const parsed = parseBrowserFromUserAgent(userAgent);
  return (
    parsed !== "unknown" &&
    (parsed.includes("Chrome") || parsed.includes("Firefox") || parsed.includes("Safari") || parsed.includes("Edge"))
  );
}

/**
 * Infer the source of an envelope as browser, mobile, or server using multiple signals
 * Priority order:
 * 1. Sender User-Agent (from HTTP request header)
 * 2. Platform & Runtime tags (from event payload)
 * 3. SDK name (fallback)
 *
 * Rules based on https://release-registry.services.sentry.io/sdks
 */
export function inferEnvelopeSource(envelopeHeader: Envelope[0], event?: any): "browser" | "mobile" | "server" {
  const sdkName = envelopeHeader?.sdk?.name || "";

  // 1. Mobile check (unchanged - already reliable from SDK name)
  // Mobile: Native mobile platforms and frameworks
  if (
    sdkName.includes("cocoa") ||
    sdkName.includes("android") ||
    sdkName.includes("react-native") ||
    sdkName.includes("flutter") ||
    sdkName.includes("capacitor") ||
    sdkName.includes("cordova") ||
    sdkName.includes("xamarin") ||
    sdkName.includes("maui") ||
    sdkName.includes("unity") ||
    sdkName.includes("kotlin.kmp")
  ) {
    return "mobile";
  }

  // 2. Sender User-Agent check
  const senderUserAgent = (envelopeHeader as any).__spotlight_sender_user_agent;
  if (senderUserAgent && typeof senderUserAgent === "string") {
    if (isBrowserUserAgent(senderUserAgent)) {
      return "browser";
    }
    // Server SDKs send server UAs like "Node.js/*", "Python-urllib/*", etc.
    // If we have a non-browser UA, we continue to further checks
  }

  // 3. Runtime tags check
  if (event?.tags?.runtime === "browser") {
    return "browser";
  }

  // 4. Platform & server-specific signals
  if (event?.contexts?.runtime?.name) {
    // Runtime context (node, CPython, etc.) indicates server
    return "server";
  }

  if (event?.server_name) {
    // server_name is a server-specific field
    return "server";
  }

  const platform = event?.platform;
  if (
    platform === "node" ||
    platform === "python" ||
    platform === "ruby" ||
    platform === "php" ||
    platform === "java" ||
    platform === "go" ||
    platform === "rust" ||
    platform === "perl" ||
    platform === "elixir" ||
    platform === "csharp" ||
    platform === "dotnet"
  ) {
    return "server";
  }

  // 5. SDK name check (existing logic as fallback)
  // Browser: JavaScript frameworks/libraries (excluding server/native runtimes and meta-frameworks)
  if (
    sdkName.startsWith("sentry.javascript.") &&
    !sdkName.includes("node") &&
    !sdkName.includes("bun") &&
    !sdkName.includes("deno") &&
    !sdkName.includes("electron") &&
    !sdkName.includes("serverless") &&
    !sdkName.includes("cloudflare") &&
    !sdkName.includes("vercel-edge") &&
    !sdkName.includes("wasm") &&
    !sdkName.includes("opentelemetry") &&
    !sdkName.includes("nextjs") &&
    !sdkName.includes("remix") &&
    !sdkName.includes("gatsby") &&
    !sdkName.includes("astro") &&
    !sdkName.includes("nuxt") &&
    !sdkName.includes("sveltekit") &&
    !sdkName.includes("solidstart") &&
    !sdkName.includes("nestjs") &&
    !sdkName.includes("tanstackstart")
  ) {
    return "browser";
  }

  // Special case: Blazor WebAssembly runs in browser
  if (sdkName.includes("blazor.webassembly")) {
    return "browser";
  }

  // Server: Everything else (node, python, ruby, go, php, java, dotnet, etc.)
  return "server";
}

/**
 * Format timestamp as local time HH:MM:SS
 */
export function formatLocalTime(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp * 1000) : new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Padding helper for vertical alignment
 */
export function padLabel(label: string, width: number): string {
  return label.padEnd(width);
}

// Constants for consistent padding
export const SOURCE_WIDTH = 7; // "browser" is the longest
export const TYPE_WIDTH = 7; // "warning" is the longest

/**
 * Colorize time with dim gray
 */
export function colorizeTime(time: string): string {
  return chalk.gray(time);
}

/**
 * Colorize source based on envelope source
 */
export function colorizeSource(source: string): string {
  switch (source) {
    case "browser":
      return chalk.yellow(padLabel(source, SOURCE_WIDTH));
    case "mobile":
      return chalk.blue(padLabel(source, SOURCE_WIDTH));
    case "server":
      return chalk.magenta(padLabel(source, SOURCE_WIDTH));
    default:
      return chalk.white(padLabel(source, SOURCE_WIDTH));
  }
}

/**
 * Colorize event type
 */
export function colorizeType(type: string): string {
  const paddedType = padLabel(type.toLowerCase(), TYPE_WIDTH);

  switch (type.toLowerCase()) {
    case "error":
      return chalk.red.bold(paddedType);
    case "warning":
      return chalk.hex("#FFA500")(paddedType); // Orange
    case "log":
      return chalk.white(paddedType);
    case "info":
      return chalk.cyan(paddedType);
    case "trace":
      return chalk.green(paddedType);
    case "debug":
      return chalk.dim(paddedType);
    default:
      return chalk.white(paddedType);
  }
}

/**
 * Format a complete log line with proper alignment and colors
 */
export function formatLogLine(
  timestamp: number | undefined,
  source: "browser" | "mobile" | "server",
  type: string,
  message: string,
): string {
  const time = colorizeTime(formatLocalTime(timestamp));
  const coloredSource = colorizeSource(source);
  const coloredType = colorizeType(type);

  return `${time} ${coloredSource} ${coloredType} ${message}`;
}
