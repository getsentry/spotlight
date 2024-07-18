import { describe, expect, test } from 'vitest';
import sentryDataCache from '~/integrations/sentry/data/sentryDataCache';
import { processEnvelope } from '~/integrations/sentry/index';

import fs from 'fs';

describe('SentryDataCache', () => {
  // We need to refactor this to make it actually testable
  test('Process Envelope', async () => {
    const envelope = fs.readFileSync('./_fixtures/envelope_javascript.txt', 'utf-8');
    const processedEnvelope = await processEnvelope({ data: envelope, contentType: 'test' });
    await expect(() =>
      sentryDataCache.pushEnvelope({ envelope: processedEnvelope.event, rawEnvelope: processedEnvelope.rawEvent }),
    ).resolves.toBeTruthy();
  });
});
