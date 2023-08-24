import { Span } from "~/types";

// mutates spans in place and adds children, as well as returns the top level tree
export function groupSpans(spans: Span[]) {
  // ordered
  const tree: Span[] = [];
  // hash with pointers
  const idLookup = new Map<string, Span>();

  [...spans]
    // need to sort root(s) first
    .sort((a, b) => (a.parent_span_id ? 1 : -1))
    .forEach((span) => {
      const parent = idLookup.get(span.parent_span_id || "");
      span.children = [];
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(span);
      } else {
        tree.push(span);
      }
      idLookup.set(span.span_id, span);
    });

  return tree;
}
