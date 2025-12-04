import Anser from "anser";
import { useMemo } from "react";

interface AnsiTextProps {
  text: string;
  className?: string;
}

/**
 * Maps ANSI color codes to Tailwind CSS classes
 */
const ANSI_COLOR_MAP: Record<string, string> = {
  // Standard colors
  "ansi-black": "text-gray-800",
  "ansi-red": "text-red-400",
  "ansi-green": "text-green-400",
  "ansi-yellow": "text-yellow-400",
  "ansi-blue": "text-blue-400",
  "ansi-magenta": "text-purple-400",
  "ansi-cyan": "text-cyan-400",
  "ansi-white": "text-white",
  // Bright variants
  "ansi-bright-black": "text-gray-300",
  "ansi-bright-red": "text-red-300",
  "ansi-bright-green": "text-green-300",
  "ansi-bright-yellow": "text-yellow-300",
  "ansi-bright-blue": "text-blue-300",
  "ansi-bright-magenta": "text-purple-300",
  "ansi-bright-cyan": "text-cyan-300",
  "ansi-bright-white": "text-white",
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

        // If no styling, use default text color
        if (classes.length === 0) {
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
