import { Span } from '../types';

function createFauxParent(
  span: Span & {
    parent_span_id: string;
  },
): Span & {
  parent_span_id: null;
} {
  return {
    trace_id: span.trace_id,
    span_id: span.parent_span_id,
    parent_span_id: null,
    op: 'unknown',
    // TODO: timestamps should represent whats encapsulated by children
    start_timestamp: new Date().getTime(),
    timestamp: new Date().getTime(),
    status: 'unknown',
  };
}

// mutates spans in place and adds children, as well as returns the top level tree
export function groupSpans(spans: Span[]) {
  // ordered
  const tree: Span[] = [];
  // hash with pointers
  const idLookup = new Map<string, Span>();

  const sortedSpans = [...spans] // need to sort root(s) first
    .sort(a => (a.parent_span_id ? 1 : 0));

  sortedSpans.forEach(span => {
    let parent = idLookup.get(span.parent_span_id || '');
    span.children = [];
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(span);
    } else if (span.parent_span_id) {
      let parentParent = sortedSpans.find(s => !s.parent_span_id);
      if (!parentParent) {
        console.log(
          `Unable to identify a faux parent (${span.parent_span_id}) for span (${span.span_id}) - root span not found. Creating imitation.`,
        );
        // XXX(dcramer): no idea why TSC thinks parent_span_id is not defined
        parentParent = createFauxParent(
          span as Span & {
            parent_span_id: string;
          },
        );
        tree.push(parentParent);
        sortedSpans.unshift(parentParent);
      }
      parent = {
        trace_id: span.trace_id,
        span_id: span.parent_span_id,
        parent_span_id: parentParent.span_id,
        op: 'orphan',
        description: 'missing parent span',
        children: [span],
        start_timestamp: span.start_timestamp,
        timestamp: span.timestamp,
        status: 'unknown',
      };
      if (!parentParent.children) parentParent.children = [];
      parentParent.children.push(parent);
    } else {
      tree.push(span);
    }
    idLookup.set(span.span_id, span);
  });

  return tree;
}
