import { log } from '../../../lib/logger';
import { Span } from '../types';

// mutates spans in place and adds children, as well as returns the top level tree
export function groupSpans(spans: Span[]) {
  // ordered
  const tree: Span[] = [];
  // hash with pointers
  const idLookup = new Map<string, Span>();

  const sortedSpans = [...spans] // need to sort root(s) first
    .sort(a => (a.parent_span_id ? 1 : 0));

  sortedSpans.forEach(span => {
    let parent = getParentOfSpan(span, idLookup, sortedSpans);
    log(`parent of span (${span.span_id}, ${span.op}, p: ${span.parent_span_id}) is ${parent?.span_id}`);
    span.children = span.children || [];
    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(span);
    } else if (span.parent_span_id) {
      const parentParent = sortedSpans.find(s => !s.parent_span_id);
      if (!parentParent) {
        log(`Root span (${span.parent_span_id}) for span (${span.span_id}). Creating orphan.`);
      } else {
        log(`Creating orphan for parent (${span.parent_span_id}) for span (${span.span_id})`);
        // log({ span });
      }
      parent = {
        trace_id: span.trace_id,
        span_id: span.parent_span_id,
        parent_span_id: parentParent ? parentParent.span_id : null,
        op: 'orphan',
        description: 'missing or unknown parent span',
        children: [span],
        start_timestamp: span.start_timestamp,
        timestamp: span.timestamp,
        status: 'unknown',
      };
      idLookup.set(parent.span_id, parent);
      // sortedSpans.splice(spanIdx, 0, parent);
      if (parentParent) {
        if (!parentParent.children) parentParent.children = [];
        parentParent.children.push(parent);
      } else {
        tree.push(parent);
      }
    } else {
      log('pushing parentless span', span);
      tree.push(span);
    }
    idLookup.set(span.span_id, span);
  });

  return tree;
}

function getParentOfSpan(span: Span, idLookup: Map<string, Span>, allSpans: Span[]): Span | undefined {
  if (!span.parent_span_id) {
    return undefined;
  }
  if (idLookup.has(span.parent_span_id)) {
    return idLookup.get(span.parent_span_id);
  }
  return allSpans.find(s => s.span_id === span.parent_span_id);
}
