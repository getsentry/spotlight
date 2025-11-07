import type { Envelope } from "@sentry/core";
import chalk from "chalk";

/**
 * Categorize SDK as browser, mobile, or server based on sdk.name
 * Rules based on https://release-registry.services.sentry.io/sdks
 */
export function categorizeSDK(envelopeHeader: Envelope[0]): "browser" | "mobile" | "server" {
  const sdkName = envelopeHeader?.sdk?.name || "";

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
export function formatLocalTime(timestamp?: number | string): string {
  let date: Date;

  if (!timestamp) {
    date = new Date();
  } else if (typeof timestamp === "string") {
    // Handle ISO string format (e.g., "2023-11-22T16:23:50.406684Z")
    date = new Date(timestamp);
  } else {
    // Handle Unix timestamp
    date = new Date(timestamp * 1000);
  }

  if (Number.isNaN(date.getTime())) {
    // placeholder with same width as valid timestamp for alignment in the logs
    return "??:??:??";
  }

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
 * Colorize source based on SDK category
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
  timestamp: number | string | undefined,
  source: "browser" | "mobile" | "server",
  type: string,
  message: string,
): string {
  const time = colorizeTime(formatLocalTime(timestamp));
  const coloredSource = colorizeSource(source);
  const coloredType = colorizeType(type);

  return `${time} ${coloredSource} ${coloredType} ${message}`;
}
