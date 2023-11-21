import { createId } from '@paralleldrive/cuid2';
import { describe, expect, test } from 'vitest';
import { Span } from '../types';
import { groupSpans } from './traces';

function mockSpan({ duration, ...span }: Partial<Span> & { duration?: number } = {}): Span {
  const defaultTimestamp = new Date().getTime();
  return {
    trace_id: createId(),
    span_id: createId(),
    parent_span_id: createId(),
    op: 'unknown',
    status: 'unknown',
    start_timestamp: defaultTimestamp,
    timestamp: duration ? (span.start_timestamp || defaultTimestamp) + duration : defaultTimestamp,
    ...span,
  };
}

describe('groupSpans', () => {
  test('empty span list', () => {
    expect(groupSpans([])).toEqual([]);
  });

  test('missing root transactions as siblings, creates faux parent', () => {
    const parent_span_id = createId();
    const span1 = mockSpan({
      parent_span_id,
    });
    const span2 = mockSpan({
      parent_span_id,
    });
    const result = groupSpans([span1, span2]);
    expect(result.length).toEqual(1);
    expect(result[0].op).toEqual('unknown');
    expect(result[0].status).toEqual('unknown');
    expect(result[0].parent_span_id).toBe(null);
    expect(result[0].children?.length).toEqual(2);
    expect(result[0].children![0].span_id).toEqual(span1.span_id);
    expect(result[0].children![1].span_id).toEqual(span2.span_id);
  });
});
