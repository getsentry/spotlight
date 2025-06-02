import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  // clsx is used for conditionally joining classNames together
  // tailwind-merge is used to merge Tailwind CSS classes
  // Reference: https://github.com/dcastil/tailwind-merge/blob/v3.3.0/docs/what-is-it-for.md
  return twMerge(clsx(inputs));
}
