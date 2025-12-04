import Anser from "anser";
import type { CSSProperties } from "react";
import { useMemo } from "react";

interface AnsiTextProps {
  text: string;
  className?: string;
}

/**
 * Sentinel theme terminal colors
 * Based on https://github.com/getsentry/sentinel
 */
const SENTINEL_COLORS = {
  black: "#181225",
  red: "#fe4144",
  green: "#83da90",
  yellow: "#FDB81B",
  blue: "#226DFC",
  magenta: "#FF45A8",
  cyan: "#22D3EE",
  white: "#f9f8f9",
  brightBlack: "#898294",
  brightRed: "#F87171",
  brightGreen: "#83da90",
  brightYellow: "#d8ab5a",
  brightBlue: "#818CF8",
  brightMagenta: "#F472B6",
  brightCyan: "#67E8F9",
  brightWhite: "#F9FAFB",
} as const;

/**
 * Maps ANSI color codes to Sentinel theme hex colors
 */
const ANSI_FG_COLOR_MAP: Record<string, string> = {
  // Standard colors
  "ansi-black": SENTINEL_COLORS.black,
  "ansi-red": SENTINEL_COLORS.red,
  "ansi-green": SENTINEL_COLORS.green,
  "ansi-yellow": SENTINEL_COLORS.yellow,
  "ansi-blue": SENTINEL_COLORS.blue,
  "ansi-magenta": SENTINEL_COLORS.magenta,
  "ansi-cyan": SENTINEL_COLORS.cyan,
  "ansi-white": SENTINEL_COLORS.white,
  // Bright variants
  "ansi-bright-black": SENTINEL_COLORS.brightBlack,
  "ansi-bright-red": SENTINEL_COLORS.brightRed,
  "ansi-bright-green": SENTINEL_COLORS.brightGreen,
  "ansi-bright-yellow": SENTINEL_COLORS.brightYellow,
  "ansi-bright-blue": SENTINEL_COLORS.brightBlue,
  "ansi-bright-magenta": SENTINEL_COLORS.brightMagenta,
  "ansi-bright-cyan": SENTINEL_COLORS.brightCyan,
  "ansi-bright-white": SENTINEL_COLORS.brightWhite,
};

/**
 * Component that renders text containing ANSI escape codes with proper styling.
 * Uses inline styles for colors (Sentinel theme) and Tailwind classes for formatting.
 */
export default function AnsiText({ text, className }: AnsiTextProps) {
  const elements = useMemo(() => {
    if (!text) return null;

    // Parse ANSI codes into tokens
    const tokens = Anser.ansiToJson(text, {
      use_classes: true, // Get named colors like "ansi-red" instead of RGB tuples
      remove_empty: false,
    });

    return tokens
      .filter(token => token.content) // Filter out empty tokens
      .map((token, index) => {
        const classes: string[] = [];
        const style: CSSProperties = {};

        // Map foreground colors using inline styles
        if (token.fg && ANSI_FG_COLOR_MAP[token.fg]) {
          style.color = ANSI_FG_COLOR_MAP[token.fg];
        }

        // Map background colors using inline styles
        if (token.bg && ANSI_FG_COLOR_MAP[token.bg]) {
          style.backgroundColor = ANSI_FG_COLOR_MAP[token.bg];
        }

        // Map formatting from decorations array using Tailwind classes
        if (token.decorations && token.decorations.length > 0) {
          if (token.decorations.includes("bold")) {
            classes.push("font-bold");
          }
          if (token.decorations.includes("italic")) {
            classes.push("italic");
          }
          if (token.decorations.includes("underline")) {
            classes.push("underline");
          }
          if (token.decorations.includes("strikethrough")) {
            classes.push("line-through");
          }
        }

        // If no foreground color specified, use default text color
        // (applies to both unstyled text and text with only formatting like bold/italic)
        if (!token.fg || !ANSI_FG_COLOR_MAP[token.fg]) {
          classes.push("text-primary-300");
        }

        return (
          <span
            key={index}
            className={classes.length > 0 ? classes.join(" ") : undefined}
            style={Object.keys(style).length > 0 ? style : undefined}
          >
            {token.content}
          </span>
        );
      });
  }, [text]);

  return <span className={className}>{elements}</span>;
}
