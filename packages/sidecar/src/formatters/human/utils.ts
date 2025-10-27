import type { Envelope } from "@sentry/core";
import chalk from "chalk";

/**
 * Categorize SDK as browser, mobile, or server based on sdk.name
 */
export function categorizeSDK(envelope: Envelope): "browser" | "mobile" | "server" {
  const sdkName = envelope[0]?.sdk?.name || "";

  // Browser patterns
  if (
    sdkName.includes("javascript.browser") ||
    sdkName.includes("javascript.react") ||
    sdkName.includes("javascript.nextjs") ||
    sdkName.includes("javascript.angular") ||
    sdkName.includes("javascript.vue") ||
    sdkName.includes("javascript.svelte") ||
    sdkName.includes("javascript.ember") ||
    sdkName.includes("javascript.gatsby") ||
    sdkName.includes("javascript.remix")
  ) {
    return "browser";
  }

  // Mobile patterns
  if (
    sdkName.includes("cocoa") || // iOS
    sdkName.includes("android") || // Android
    sdkName.includes("react-native") || // React Native
    sdkName.includes("flutter") || // Flutter
    sdkName.includes("xamarin") || // Xamarin
    sdkName.includes("dart") || // Dart/Flutter
    sdkName.includes("unity") // Unity mobile
  ) {
    return "mobile";
  }

  // Everything else is server (node, python, go, ruby, php, java, etc.)
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
