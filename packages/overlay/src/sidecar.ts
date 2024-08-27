import type React from 'react';
import { log } from './lib/logger';

export function connectToSidecar(
  sidecarUrl: string,
  contentTypeListeners: [contentType: string, listener: (event: MessageEvent) => void][],
  setOnline: React.Dispatch<React.SetStateAction<boolean>>,
): () => void {
  log('Connecting to sidecar at', sidecarUrl);
  const source = new EventSource(sidecarUrl);

  for (const [contentType, listener] of contentTypeListeners) {
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
    log(`Removing ${contentTypeListeners.length} listeners`);
    for (const typeAndListener of contentTypeListeners) {
      source.removeEventListener(typeAndListener[0], typeAndListener[1]);
      log('Removed listener for type', typeAndListener[0]);
    }
  };
}
