/**
 * Utilities for parsing Sentry envelopes for debug logging
 */

export interface EnvelopeHeader {
  event_id?: string;
  sdk?: {
    name: string;
    version?: string;
  };
}

export interface ItemHeader {
  type?: string;
  length?: number;
}

export interface EventPayload {
  platform?: string;
  environment?: string;
  level?: string;
  message?: string;
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
    }>;
  };
}
