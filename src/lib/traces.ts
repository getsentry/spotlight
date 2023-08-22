import { Span } from "~/types";

// mutates spans in place and adds children, as well as returns the top level tree
export function groupSpans(spans: Span[]) {
  // ordered
  const tree: Span[] = [];
  // hash with pointers
  const idLookup: { [spanId: string]: Span } = {};

  spans.forEach((span) => {
    const parent = idLookup[span.parent_span_id || ""];
    span.children = [];
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(span);
    } else {
      tree.push(span);
    }
    idLookup[span.span_id] = span;
  });

  return tree;
}
