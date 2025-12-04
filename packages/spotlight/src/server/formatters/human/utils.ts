import type { Envelope } from "@sentry/core";
import chalk from "chalk";
import { parseBrowserFromUserAgent } from "../../routes/stream/userAgent.ts";

export const SOURCE_TYPES = ["browser", "mobile", "server"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const LOG_LEVELS = ["error", "warning", "log", "info", "trace", "debug"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Sentinel theme terminal colors
 * Based on https://github.com/getsentry/sentinel
 */
const SENTINEL = {
  red: "#fe4144",
  green: "#83da90",
  yellow: "#FDB81B",
  blue: "#226DFC",
  magenta: "#FF45A8",
  white: "#f9f8f9",
  muted: "#898294",
} as const;

export const SOURCE_COLORS: Record<SourceType, (text: string) => string> = {
  browser: chalk.hex(SENTINEL.yellow),
  mobile: chalk.hex(SENTINEL.blue),
  server: chalk.hex(SENTINEL.magenta),
};

export const LOG_LEVEL_COLORS: Record<LogLevel, (text: string) => string> = {
  error: chalk.red.bold,
  warning: chalk.hex("#FFA500"), // Orange
  log: chalk.white,
  info: chalk.cyan,
  trace: chalk.green,
  debug: chalk.dim,
};

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
export function inferEnvelopeSource(envelopeHeader: Envelope[0], event?: any): SourceType {
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

// Constants for consistent padding (adding brackets)
export const SOURCE_WIDTH = Math.max(...SOURCE_TYPES.map(s => `[${s.toUpperCase()}]`.length));
export const TYPE_WIDTH = Math.max(...LOG_LEVELS.map(l => `[${l.toUpperCase()}]`.length));

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
  const bracketed = `[${source}]`;
  const padded = padLabel(bracketed, SOURCE_WIDTH);
  const colorFn = SOURCE_COLORS[source as SourceType] || chalk.white;
  return colorFn(padded);
}

/**
 * Colorize event type
 */
export function colorizeType(type: string): string {
  const bracketed = `[${type.toUpperCase()}]`;
  const padded = padLabel(bracketed, TYPE_WIDTH);
  const colorFn = LOG_LEVEL_COLORS[type.toLowerCase() as LogLevel] || chalk.white;
  return colorFn(padded);
}

/**
 * Format a complete log line with proper alignment and colors
 */
export function formatLogLine(
  timestamp: number | string | undefined,
  source: SourceType,
  type: string,
  message: string,
): string {
  const time = colorizeTime(formatLocalTime(timestamp));
  const coloredSource = colorizeSource(source);
  const coloredType = colorizeType(type);

  return `${time} ${coloredType} ${coloredSource} ${message}`;
}
