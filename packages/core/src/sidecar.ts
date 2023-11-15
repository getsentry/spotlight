import React from 'react';
import { Integration } from './integrations/integration';
import { TriggerButtonCount } from './types';

export function connectToSidecar(
  sidecarUrl: string,
  contentTypeToIntegrations: Map<string, Integration<unknown>[]>,
  setIntegrationData: React.Dispatch<React.SetStateAction<Record<string, Array<unknown>>>>,
  setOnline: React.Dispatch<React.SetStateAction<boolean>>,
  setTriggerButtonCount: React.Dispatch<React.SetStateAction<TriggerButtonCount>>,
): () => void {
  console.log('[Spotlight] Connecting to sidecar at', sidecarUrl);
  const source = new EventSource(sidecarUrl);

  const contentTypeListeners: [contentType: string, listener: (event: MessageEvent) => void][] = [];

  for (const [contentType, integrations] of contentTypeToIntegrations.entries()) {
    const listener = (event: MessageEvent): void => {
      console.log(`[spotlight] Received new ${contentType} event`);
      integrations.forEach(integration => {
        if (integration.processEvent) {
          // TODO: This will not stay but I'll refactor it later with a better processEvent API.
          let isSevere = false;
          const markEventSevere = (severe: boolean = true) => {
            isSevere = severe;
          };
          const processedEvent = integration.processEvent({
            contentType,
            data: event.data,
            markEventSevere,
          });
          if (processedEvent) {
            setIntegrationData(prev => {
              return {
                ...prev,
                [contentType]: [...(prev[contentType] || []), processedEvent],
              };
            });
            setTriggerButtonCount(prev => {
              return {
                ...prev,
                [isSevere ? 'severe' : 'general']: prev[isSevere ? 'severe' : 'general'] + 1,
              };
            });
          }
        }
      });
    };

    // `contentType` could for example be "application/x-sentry-envelope"
    contentTypeListeners.push([contentType, listener]);
    source.addEventListener(contentType, listener);

    console.log('[spotlight] added listener for', contentType, 'sum', contentTypeListeners.length);
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
