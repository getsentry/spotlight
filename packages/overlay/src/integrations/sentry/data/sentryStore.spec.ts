import fs from 'node:fs';
import { describe, expect, test } from 'vitest';
import { processEnvelope } from '../index';
import useSentryStore from './sentryStore';

describe('SentryStore', () => {
  test('Process Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_javascript.txt');
    const processedEnvelope = processEnvelope({ data: envelope, contentType: 'test' });
    expect(
      useSentryStore
        .getState()
        .pushEnvelope({ envelope: processedEnvelope.event, rawEnvelope: processedEnvelope.rawEvent }),
    ).toBeGreaterThanOrEqual(0);
  });
});
