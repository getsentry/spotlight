import chalk from "chalk";

import { SOURCE_TYPES, type SourceType } from "../../../telemetry/envelope/source.ts";
export { SOURCE_TYPES, type SourceType, inferEnvelopeSource } from "../../../telemetry/envelope/source.ts";

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
