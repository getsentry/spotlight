import Anser from "anser";
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
  cyan: "#FF45A8",
  white: "#f9f8f9",
  brightBlack: "#898294",
  brightRed: "#F87171",
  brightGreen: "#83da90",
  brightYellow: "#d8ab5a",
  brightBlue: "#818CF8",
  brightMagenta: "#F472B6",
  brightCyan: "#FF70BC",
  brightWhite: "#F9FAFB",
} as const;

/**
 * Maps ANSI color codes to Sentinel theme colors
 */
const ANSI_COLOR_MAP: Record<string, string> = {
  // Standard colors
  "ansi-black": `text-[${SENTINEL_COLORS.black}]`,
  "ansi-red": `text-[${SENTINEL_COLORS.red}]`,
  "ansi-green": `text-[${SENTINEL_COLORS.green}]`,
  "ansi-yellow": `text-[${SENTINEL_COLORS.yellow}]`,
  "ansi-blue": `text-[${SENTINEL_COLORS.blue}]`,
  "ansi-magenta": `text-[${SENTINEL_COLORS.magenta}]`,
  "ansi-cyan": `text-[${SENTINEL_COLORS.cyan}]`,
  "ansi-white": `text-[${SENTINEL_COLORS.white}]`,
  // Bright variants
  "ansi-bright-black": `text-[${SENTINEL_COLORS.brightBlack}]`,
  "ansi-bright-red": `text-[${SENTINEL_COLORS.brightRed}]`,
  "ansi-bright-green": `text-[${SENTINEL_COLORS.brightGreen}]`,
  "ansi-bright-yellow": `text-[${SENTINEL_COLORS.brightYellow}]`,
  "ansi-bright-blue": `text-[${SENTINEL_COLORS.brightBlue}]`,
  "ansi-bright-magenta": `text-[${SENTINEL_COLORS.brightMagenta}]`,
  "ansi-bright-cyan": `text-[${SENTINEL_COLORS.brightCyan}]`,
  "ansi-bright-white": `text-[${SENTINEL_COLORS.brightWhite}]`,
};

/**
 * Component that renders text containing ANSI escape codes with proper styling
 * using Tailwind CSS classes.
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

        // Map foreground colors
        if (token.fg) {
          const colorClass = ANSI_COLOR_MAP[token.fg];
          if (colorClass) {
            classes.push(colorClass);
          }
        }

        // Map background colors (optional, less common in logs)
        if (token.bg) {
          const bgColorClass = ANSI_COLOR_MAP[token.bg]?.replace("text-", "bg-");
          if (bgColorClass) {
            classes.push(bgColorClass);
          }
        }

        // Map formatting from decorations array
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
        if (!token.fg || !ANSI_COLOR_MAP[token.fg]) {
          classes.push("text-primary-300");
        }

        return (
          <span key={index} className={classes.join(" ")}>
            {token.content}
          </span>
        );
      });
  }, [text]);

  return <span className={className}>{elements}</span>;
}
