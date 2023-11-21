import React from 'react';
import { Integration, IntegrationData } from './integrations/integration';
import { TriggerButtonCount } from './types';

export function connectToSidecar(
  sidecar: string,
  contentTypeToIntegrations: Map<string, Integration<unknown>[]>,
  setIntegrationData: React.Dispatch<React.SetStateAction<IntegrationData<unknown>>>,
  setOnline: React.Dispatch<React.SetStateAction<boolean>>,
  setTriggerButtonCount: React.Dispatch<React.SetStateAction<TriggerButtonCount>>,
): () => void {
  console.log('[Spotlight] Connecting to sidecar at', sidecar);
  const source = new EventSource(sidecar);

  const contentTypeListeners: [contentType: string, listener: (event: MessageEvent) => void][] = [];

  for (const [contentType, integrations] of contentTypeToIntegrations.entries()) {
    const listener = (event: MessageEvent): void => {
      console.log(`[spotlight] Received new ${contentType} event`);
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

    console.log('[spotlight] adding listener for', contentType, 'sum', contentTypeListeners.length);

    // `contentType` could for example be "application/x-sentry-envelope"
    contentTypeListeners.push([contentType, listener]);
    source.addEventListener(contentType, listener);
  }

  source.addEventListener('open', () => {
    setOnline(true);
    console.log('[Spotlight] open');
  });

  source.addEventListener('error', err => {
    setOnline(false);
    console.error('EventSource failed:', err);
  });

  return () => {
    console.log(`[spotlight] removing ${contentTypeListeners.length} listeners`);
    contentTypeListeners.forEach(typeAndListener => {
      source.removeEventListener(typeAndListener[0], typeAndListener[1]);
      console.log('[spotlight] removed listner for type', typeAndListener[0]);
    });
  };
}
