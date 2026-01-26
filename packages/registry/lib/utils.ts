import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with conditional support.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates an ID string to a specified length.
 * Useful for displaying shortened trace/span IDs.
 */
export function truncateId(id = "", length = 8): string {
  return id.substring(0, length);
}
