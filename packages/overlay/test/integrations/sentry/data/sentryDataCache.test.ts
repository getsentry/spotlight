import { describe, expect, test } from 'vitest';
import sentryDataCache from '~/integrations/sentry/data/sentryDataCache';
import { processEnvelope } from '~/integrations/sentry/index';

import fs from 'fs';

describe('SentryDataCache', () => {
  // We need to refactor this to make it actually testable
  test('Process Envelope', () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_javascript.txt', 'utf-8');
    const processedEnvelope = processEnvelope({ data: envelope, contentType: 'test' });
    sentryDataCache.pushEnvelope({
      envelope: processedEnvelope.event,
      rawEnvelope: { data: envelope, contentType: 'test' },
    });
    expect(true).not.toBe(undefined);
  });
});
