import type React from 'react';
import type { Integration, IntegrationData } from './integrations/integration';
import { log } from './lib/logger';

export function connectToSidecar(
  sidecarUrl: string,
  contentTypeToIntegrations: Map<string, Integration<unknown>[]>,
  setIntegrationData: React.Dispatch<React.SetStateAction<IntegrationData<unknown>>>,
  setOnline: React.Dispatch<React.SetStateAction<boolean>>,
): () => void {
  log('Connecting to sidecar at', sidecarUrl);
  const source = new EventSource(sidecarUrl);

  const contentTypeListeners: [contentType: string, listener: (event: MessageEvent) => void][] = [];

  for (const [contentType, integrations] of contentTypeToIntegrations.entries()) {
    const listener = (event: MessageEvent): void => {
      log(`Received new ${contentType} event`);
      for (const integration of integrations) {
        const integrationData = integration.processEvent
          ? integration.processEvent({
              contentType,
              data: event.data,
            })
          : { event };

        if (!integrationData) {
          continue;
        }
        setIntegrationData(prev => {
          const integrationName = integration.name;
          return {
            ...prev,
            [integrationName]: [...(prev[integrationName] || []), integrationData],
          };
        });
      }
    };

    log('Adding listener for', contentType, 'sum', contentTypeListeners.length);

    // `contentType` could for example be "application/x-sentry-envelope"
    contentTypeListeners.push([contentType, listener]);
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
