import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with conditional support.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-primary", "hover:bg-muted")
 * // Returns: "px-4 py-2 bg-primary hover:bg-muted" (if isActive is true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates an ID string to a specified length.
 * Useful for displaying shortened trace/span IDs.
 *
 * @param id - The ID string to truncate
 * @param length - Maximum length (default: 8)
 * @returns Truncated ID string
 *
 * @example
 * truncateId("abc123def456ghi789") // "abc123de"
 * truncateId("abc123def456ghi789", 4) // "abc1"
 */
export function truncateId(id = "", length = 8): string {
  return id.substring(0, length);
}
