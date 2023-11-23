import { describe, expect, test } from 'vitest';
import { processEnvelope } from '../index';
import sentryDataCache from './sentryDataCache';

import fs from 'fs';

describe('SentryDataCache', () => {
  // We need to refactor this to make it actually testable
  test('Process Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope1.txt', 'utf-8');
    const processedEnvelope = processEnvelope({ data: envelope, contentType: 'test' });
    sentryDataCache.pushEnvelope(processedEnvelope.event);
    expect(true).not.toBe(undefined);
  });
});
