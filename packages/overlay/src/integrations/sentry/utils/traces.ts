import { log } from "../../../lib/logger";
import type { Span, Trace } from "../types";

// mutates spans in place and adds children, as well as returns the top level tree
export function groupSpans(spans: Map<string, Span>): Span[] {
  const tree: Span[] = [];

  // need to sort root(s) first
  const sortedSpans = Array.from(spans.values()).sort((a, b) => {
    const parentComp = (a.parent_span_id ? 1 : 0) - (b.parent_span_id ? 1 : 0);
    return parentComp === 0 ? compareSpans(a, b) : parentComp;
  });

  for (const span of sortedSpans) {
    let parent = span && getParentOfSpan(span, spans, sortedSpans);

    span.children ??= [];
    if (parent) {
      parent.children ??= [];
      parent.children.push(span);
    } else if (span.parent_span_id) {
      const parentParent = sortedSpans.find(s => !s.parent_span_id);
      if (!parentParent) {
        log(`Root span (${span.parent_span_id}) for span (${span.span_id}). Creating orphan.`);
      } else {
        log(`Creating orphan for parent (${span.parent_span_id}) for span (${span.span_id})`);
      }
      parent = {
        trace_id: span.trace_id,
        span_id: span.parent_span_id,
        parent_span_id: parentParent ? parentParent.span_id : null,
        op: "orphan",
        description: "missing or unknown parent span",
        children: [span],
        start_timestamp: span.start_timestamp,
        timestamp: span.timestamp,
        status: "unknown",
      };
      spans.set(parent.span_id, parent);
      // sortedSpans.splice(spanIdx, 0, parent);
      if (parentParent) {
        parentParent.children ??= [];
        parentParent.children.push(parent);
      } else {
        tree.push(parent);
      }
    } else {
      tree.push(span);
    }
    spans.set(span.span_id, span);
  }

  return tree;
}

function getParentOfSpan(span: Span, idLookup: Map<string, Span>, allSpans: Span[]): Span | undefined {
  if (!span.parent_span_id) {
    return undefined;
  }

  return idLookup.get(span.parent_span_id) || allSpans.find(s => s.span_id === span.parent_span_id);
}

export function compareSpans(a: { start_timestamp: number }, b: { start_timestamp: number }): number {
  return a.start_timestamp - b.start_timestamp;
}

export function getRootTransactionMethod(trace: Trace) {
  const method = String(
    trace.rootTransaction?.contexts?.trace.data?.method || trace.rootTransaction?.request?.method || "",
  );
  return method;
}

export function getRootTransactionName(trace: Trace) {
  const method = getRootTransactionMethod(trace);
  const name =
    method && trace.rootTransactionName.startsWith(method)
      ? trace.rootTransactionName.slice(method.length + 1)
      : trace.rootTransactionName;

  return name;
}
