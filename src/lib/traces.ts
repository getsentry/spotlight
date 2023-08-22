import { Span } from "~/types";

export type SpanWithChildren = Span & {
  children: SpanWithChildren[];
};

export function groupSpans(spans: Span[]) {
  // ordered
  const results: SpanWithChildren[] = [];
  // hash with pointers
  const idLookup: { [spanId: string]: SpanWithChildren } = {};

  spans.forEach((span) => {
    const parent = idLookup[span.parent_span_id || ""];
    const newItem = {
      ...span,
      children: [],
    };
    if (parent) {
      parent.children.push(newItem);
    } else {
      results.push(newItem);
    }
    idLookup[span.span_id] = newItem;
  });

  return results;
}
