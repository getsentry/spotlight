import React from 'react';
import { Integration, IntegrationData } from './integrations/integration';
import { log } from './lib/logger';
import { TriggerButtonCount } from './types';

export function connectToSidecar(
  sidecar: string,
  contentTypeToIntegrations: Map<string, Integration<unknown>[]>,
  setIntegrationData: React.Dispatch<React.SetStateAction<IntegrationData<unknown>>>,
  setOnline: React.Dispatch<React.SetStateAction<boolean>>,
  setTriggerButtonCount: React.Dispatch<React.SetStateAction<TriggerButtonCount>>,
): () => void {
  log('Connecting to sidecar at', sidecar);
  const source = new EventSource(sidecar);

  const contentTypeListeners: [contentType: string, listener: (event: MessageEvent) => void][] = [];

  for (const [contentType, integrations] of contentTypeToIntegrations.entries()) {
    const listener = (event: MessageEvent): void => {
      log(`Received new ${contentType} event`);
      integrations.forEach(integration => {
        if (integration.processEvent) {
          const processedEvent = integration.processEvent({
            contentType,
            data: event.data,
          });
          if (processedEvent) {
            setIntegrationData(prev => {
              const integrationName = integration.name;
              return {
                ...prev,
                [integrationName]: [...(prev[integrationName] || []), processedEvent],
              };
            });
            setTriggerButtonCount(prev => {
              const keyToUpdate = processedEvent.severity === 'severe' ? 'severe' : 'general';
              return {
                ...prev,
                [keyToUpdate]: prev[keyToUpdate] + 1,
              };
            });
          }
        }
      });
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
    contentTypeListeners.forEach(typeAndListener => {
      source.removeEventListener(typeAndListener[0], typeAndListener[1]);
      log('Removed listener for type', typeAndListener[0]);
    });
  };
}
