import { describe, expect, test } from 'vitest';
import { processEnvelope } from './index';

import fs from 'fs';

describe('Sentry Integration', () => {
  test('Process Envelope', () => {
    const envelope1 = fs.readFileSync('./_fixtures/envelope1.txt', 'utf-8');
    expect(processEnvelope({ data: envelope1 })).not.toBe(undefined);
  });
});
