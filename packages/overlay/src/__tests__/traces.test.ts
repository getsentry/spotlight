import { describe, expect, test } from 'vitest';
import { Span } from '../integrations/sentry/types';
import { groupSpans } from '../integrations/sentry/utils/traces';
import { generate_uuidv4 } from '../lib/uuid';

function mockSpan({ duration, ...span }: Partial<Span> & { duration?: number } = {}): Span {
  const defaultTimestamp = new Date().getTime();
  return {
    trace_id: generate_uuidv4(),
    span_id: generate_uuidv4(),
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

  test('simple parent and child relationship', () => {
    const parent1 = mockSpan({});
    const span1 = mockSpan({
      parent_span_id: parent1.span_id,
      trace_id: parent1.trace_id,
    });
    const span2 = mockSpan({
      parent_span_id: parent1.span_id,
      trace_id: parent1.trace_id,
    });
    const result = groupSpans([parent1, span1, span2]);
    console.debug(result);
    expect(result.length).toEqual(1);
    expect(result[0].span_id).toEqual(parent1.span_id);
    expect(result[0].children?.length).toEqual(2);
    expect(result[0].children![0].span_id).toEqual(span1.span_id);
    expect(result[0].children![1].span_id).toEqual(span2.span_id);
  });

  test('multiple parent and child relationship both parents as root', () => {
    const parent1 = mockSpan({
      start_timestamp: new Date().getTime() - 1,
    });

    const span1 = mockSpan({
      parent_span_id: parent1.span_id,
      trace_id: parent1.trace_id,
    });
    const span2 = mockSpan({
      parent_span_id: parent1.span_id,
      trace_id: parent1.trace_id,
    });

    const parent2 = mockSpan({});
    const span3 = mockSpan({
      parent_span_id: parent2.span_id,
      trace_id: parent2.trace_id,
    });
    const span4 = mockSpan({
      parent_span_id: parent2.span_id,
      trace_id: parent2.trace_id,
    });
    const result = groupSpans([parent1, span1, span2, parent2, span3, span4]);
    console.debug(result);
    expect(result.length).toEqual(2);
    expect(result[0].span_id).toEqual(parent1.span_id);
    expect(result[0].children?.length).toEqual(2);
    expect(result[0].children![0].span_id).toEqual(span1.span_id);
    expect(result[0].children![1].span_id).toEqual(span2.span_id);
    expect(result[1].span_id).toEqual(parent2.span_id);
    expect(result[1].children?.length).toEqual(2);
    expect(result[1].children![0].span_id).toEqual(span3.span_id);
    expect(result[1].children![1].span_id).toEqual(span4.span_id);
  });

  test('missing root transactions as siblings, creates faux parent', () => {
    const parent_span_id = generate_uuidv4();
    const span1 = mockSpan({
      parent_span_id,
    });
    const span2 = mockSpan({
      parent_span_id,
      trace_id: span1.trace_id,
    });
    const result = groupSpans([span1, span2]);
    console.debug(result);
    expect(result.length).toEqual(1);
    expect(result[0].op).toEqual('orphan');
    expect(result[0].description).toEqual('missing or unknown parent span');
    expect(result[0].status).toEqual('unknown');
    expect(result[0].parent_span_id).toBe(null);
    console.debug(result[0].children);
    expect(result[0].children?.length).toEqual(2);
    expect(result[0].children![0].span_id).toEqual(span1.span_id);
    expect(result[0].children![1].span_id).toEqual(span2.span_id);
  });

  test('missing root transactions as independent children, creates faux parents', () => {
    const span1 = mockSpan({
      parent_span_id: generate_uuidv4(),
    });
    const span2 = mockSpan({
      parent_span_id: generate_uuidv4(),
      trace_id: span1.trace_id,
    });
    const result = groupSpans([span1, span2]);
    console.debug(result);
    expect(result.length).toEqual(2);
    expect(result[0].span_id).toEqual(span1.parent_span_id);
    expect(result[0].op).toEqual('orphan');
    expect(result[0].description).toEqual('missing or unknown parent span');
    expect(result[0].status).toEqual('unknown');
    expect(result[0].parent_span_id).toBe(null);
    console.debug(result[0].children);
    expect(result[0].children?.length).toEqual(1);
    expect(result[0].children![0].span_id).toEqual(span1.span_id);

    expect(result[1].span_id).toEqual(span2.parent_span_id);
    expect(result[1].op).toEqual('orphan');
    expect(result[1].description).toEqual('missing or unknown parent span');
    expect(result[1].status).toEqual('unknown');
    expect(result[1].parent_span_id).toBe(null);
    console.debug(result[1].children);
    expect(result[1].children?.length).toEqual(1);
    expect(result[1].children![0].span_id).toEqual(span2.span_id);
  });
});
