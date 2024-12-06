export const DEFAULT_SIDECAR_URL = 'http://localhost:8969';
export const DEFAULT_SIDECAR_STREAM_URL = new URL('/stream', DEFAULT_SIDECAR_URL).href;

export const DEFAULT_EXPERIMENTS = {
  'sentry:focus-local-events': true,
};

export const DEFAULT_ANCHOR = 'bottomRight';
export const SPOTLIGHT_OPEN_CLASS_NAME = '__spotlight_open';
