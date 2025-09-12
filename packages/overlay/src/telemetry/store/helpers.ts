import type { Span } from "../types";

export function getAllSpansInTree(root: Span): Span[] {
  const spans = [root];
  return root.children ? spans.concat(root.children.flatMap(getAllSpansInTree)) : spans;
}
