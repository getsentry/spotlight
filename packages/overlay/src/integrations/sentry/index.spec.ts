import { describe, expect, test } from 'vitest';
import { processEnvelope } from './index';

import type { Event } from '@sentry/types';
import fs from 'node:fs';
import sentryDataCache from './data/sentryDataCache';

describe('Sentry Integration', () => {
  test('Process Envelope Empty', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_empty.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_javascript.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Python Transaction Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_python.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process PHP Transaction Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_php.txt');
    const processedEnvelope = processEnvelope({ data: envelope, contentType: 'test' });
    expect(processedEnvelope).not.toBe(undefined);
    expect((processedEnvelope.event[1][0][1] as any).type).toEqual('transaction');
  });

  test('Process Java Transaction Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_java.txt');
    const processedEnvelope = processEnvelope({ data: envelope, contentType: 'test' });
    expect(processedEnvelope.event).not.toBe(undefined);
    expect((processedEnvelope.event[1][0][1] as any).type).toEqual('transaction');
  });

  test('Process Astro SSR pageload (BE -> FE) trace', () => {
    const nodeEnvelope = fs.readFileSync('./_fixtures/envelope_astro_ssr_node.txt');
    const processedNodeEnvelope = processEnvelope({ data: nodeEnvelope, contentType: 'test' });

    const browserEnvelope = fs.readFileSync('./_fixtures/envelope_astro_ssr_browser.txt');
    const processedBrowserEnvelope = processEnvelope({ data: browserEnvelope, contentType: 'test' });

    expect(processedNodeEnvelope).not.toBe(undefined);
    expect(processedBrowserEnvelope).not.toBe(undefined);

    const nodeEvent = processedNodeEnvelope.event[1][0][1] as Event;
    const browserEvent = processedBrowserEnvelope.event[1][0][1] as Event;

    expect(nodeEvent.spans?.length).toEqual(0);
    expect(browserEvent.spans?.length).toEqual(45);
    expect(nodeEvent.type).toEqual('transaction');
    expect(browserEvent.type).toEqual('transaction');

    const nodeTraceId = nodeEvent.contexts?.trace?.trace_id;
    const browserTraceId = browserEvent.contexts?.trace?.trace_id;
    expect(nodeTraceId).toEqual(browserTraceId);

    const createdTrace = sentryDataCache.getTraceById(nodeTraceId!)!;
    expect(createdTrace.spans).toHaveLength(47);

    expect(createdTrace.rootTransaction?.transaction).toEqual('GET /');
    expect(createdTrace.spanTree).toHaveLength(1);
    expect(createdTrace.spanTree[0].children).toHaveLength(1);
    expect(createdTrace.spanTree[0].children![0].children).toHaveLength(45);
  });

  test('Process Angular Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_angular.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Java Formatted Message Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_java_formatted_message.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope w/ Binary Data', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_binary.bin');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope w/ Empty Payloads', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_empty_payload.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope w/ implicit length, terminated by newline', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_no_len_w_new_line.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope w/ implicit length, terminated by EOF', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_no_len_w_eof.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope w/ implicit length, terminated by EOF, empty headers', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_no_len_w_eof_empty_headers.txt');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope w/ flutter replay video', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_flutter_replay.bin');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });

  test('Process Envelope w/ PNG screenshot', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_with_screenshot.bin');
    expect(processEnvelope({ data: envelope, contentType: 'test' })).not.toBe(undefined);
  });
});
