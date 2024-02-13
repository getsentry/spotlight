import { describe, expect, test } from 'vitest';
import { processEnvelope } from '~/integrations/sentry/index';

import { Event } from '@sentry/types';
import fs from 'fs';
import sentryDataCache from '~/integrations/sentry/data/sentryDataCache';

describe('Sentry Integration', () => {
  test('Process Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_javascript.txt', 'utf-8');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Python Transaction Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_python.txt', 'utf-8');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process PHP Transaction Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_php.txt', 'utf-8');
    const processedEnvelope = processEnvelope({ data: envelope, contentType: 'test' });
    expect(processedEnvelope).not.toBe(undefined);
    expect((processedEnvelope.event[1][0][1] as any).type).toEqual('transaction');
  });

  test('Process Astro SSR pageload (BE -> FE) trace', () => {
    const nodeEnvelope = fs.readFileSync('./_fixtures/envelope_astro_ssr_node.txt', 'utf-8');
    const processedNodeEnvelope = processEnvelope({ data: nodeEnvelope, contentType: 'test' });

    const browserEnvelope = fs.readFileSync('./_fixtures/envelope_astro_ssr_browser.txt', 'utf-8');
    const processedBroswerEnvelope = processEnvelope({ data: browserEnvelope, contentType: 'test' });

    expect(processedNodeEnvelope).not.toBe(undefined);
    expect(processedBroswerEnvelope).not.toBe(undefined);

    const nodeEvent = processedNodeEnvelope.event[1][0][1] as Event;
    const browserEvent = processedBroswerEnvelope.event[1][0][1] as Event;

    expect(nodeEvent.spans?.length).toEqual(0);
    expect(browserEvent.spans?.length).toEqual(45);
    expect(nodeEvent.type).toEqual('transaction');
    expect(browserEvent.type).toEqual('transaction');

    const nodeTraceId = nodeEvent.contexts?.trace?.trace_id;
    const browserTraceId = browserEvent.contexts?.trace?.trace_id;
    expect(nodeTraceId).toEqual(browserTraceId);

    const createdTrace = sentryDataCache.getTraceById(nodeTraceId!);
    expect(createdTrace.spans).toHaveLength(47);

    expect(createdTrace.rootTransaction?.transaction).toEqual('GET /');
    expect(createdTrace.spanTree).toHaveLength(1);
    expect(createdTrace.spanTree[0].children).toHaveLength(1);
    expect(createdTrace.spanTree[0].children![0].children).toHaveLength(45);
  });

  test('Process Angular Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_angular.txt', 'utf-8');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Java Formatted Message Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_java_formatted_message.txt', 'utf-8');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });
});
