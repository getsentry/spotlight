import { describe, expect, test } from 'vitest';
import { processEnvelope } from './index';

import fs from 'fs';

describe('Sentry Integration', () => {
  test('Process Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope1.txt', 'utf-8');
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
    expect(processedEnvelope.event[1][0][1].type).toEqual('transaction');
  });
});
