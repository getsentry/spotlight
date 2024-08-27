import type React from 'react';
import { log } from './lib/logger';

export function connectToSidecar(
  sidecarUrl: string,
  // Content Type to listener
  contentTypeListeners: Record<string, (event: MessageEvent) => void>,
  setOnline: React.Dispatch<React.SetStateAction<boolean>>,
): () => void {
  log('Connecting to sidecar at', sidecarUrl);
  const source = new EventSource(sidecarUrl);

  for (const [contentType, listener] of Object.entries(contentTypeListeners)) {
    source.addEventListener(contentType, listener);
  }

  source.addEventListener('open', () => {
    setOnline(true);
    log('Open');
  });

  source.addEventListener('error', err => {
    setOnline(false);
    console.error('EventSource failed:', err);
  });

  return () => {
    log('Removing all content type listeners');
    for (const [contentType, listener] of Object.entries(contentTypeListeners)) {
      source.removeEventListener(contentType, listener);
      log('Removed listener for type', contentType);
    }
  };
}
