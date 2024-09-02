import { describe, expect, test } from 'vitest';
import { processEnvelope } from '../index';
import sentryDataCache from './sentryDataCache';

import fs from 'node:fs';

describe('SentryDataCache', () => {
  // We need to refactor this to make it actually testable
  test('Process Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_javascript.txt', 'utf-8');
    const processedEnvelope = processEnvelope({ data: envelope, contentType: 'test' });
    expect(
      sentryDataCache.pushEnvelope({ envelope: processedEnvelope.event, rawEnvelope: processedEnvelope.rawEvent }),
    ).toBeGreaterThanOrEqual(0);
  });
});
