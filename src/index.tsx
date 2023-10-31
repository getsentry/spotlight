import React from 'react';
import ReactDOM from 'react-dom/client';

import fontStyles from '@fontsource/raleway/index.css?inline';

import App from './App.tsx';
import type { Integration } from './integrations/integration';
import { initIntegrations } from './integrations/integration';
import globalStyles from './index.css?inline';

// TODO: get rid of this here
import dataCache from './lib/dataCache.ts';

export { default as sentry } from './integrations/sentry';
export { default as console } from './integrations/console';

function createStyleSheet(styles: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);
  return sheet;
}

const spotlightEventTarget: EventTarget = new EventTarget();

/**
 * Open or close the Spotlight UI
 */
export async function toggleSpotlight() {
  spotlightEventTarget.dispatchEvent(new Event('toggle'));
}

export async function init({
  fullScreen = false,
  showTriggerButton = true,
  integrations,
  defaultEventId,
}: {
  integrations?: Integration[];
  fullScreen?: boolean;
  defaultEventId?: string;
  sidecarUrl?: string;
  showTriggerButton?: boolean;
} = {}) {
  if (typeof document === 'undefined') return;

  const initializedIntegrations = await initIntegrations(integrations);

  // build shadow dom container to contain styles
  const docRoot = document.createElement('div');
  docRoot.id = 'sentry-spotlight-root';
  const shadow = docRoot.attachShadow({ mode: 'open' });
  const appRoot = document.createElement('div');
  appRoot.style.position = 'absolute';
  appRoot.style.top = '0';
  appRoot.style.left = '0';
  appRoot.style.right = '0';
  shadow.appendChild(appRoot);

  const ssGlobal = createStyleSheet(globalStyles);
  shadow.adoptedStyleSheets = [createStyleSheet(fontStyles), ssGlobal];

  if (import.meta.hot) {
    import.meta.hot.accept('./index.css?inline', newGlobalStyles => {
      ssGlobal.replaceSync(newGlobalStyles?.default);
    });
  }

  ReactDOM.createRoot(appRoot).render(
    // <React.StrictMode>
    <App
      integrations={initializedIntegrations}
      fullScreen={fullScreen}
      defaultEventId={defaultEventId}
      eventTarget={spotlightEventTarget}
      showTriggerButton={showTriggerButton}
    />,
    // </React.StrictMode>
  );

  window.addEventListener('load', () => {
    console.log('[spotlight] Injecting into application');

    document.body.append(docRoot);
  });
}

export function connectToSidecar(
  sidecarUrl: string,
  contentTypeToIntegrations: Map<string, Integration<unknown>[]>,
  setIntegrationData: React.Dispatch<React.SetStateAction<Record<string, Array<unknown>>>>,
): () => void {
  console.log('[Spotlight] Connecting to sidecar at', sidecarUrl);
  const source = new EventSource(sidecarUrl);

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
              return {
                ...prev,
                [contentType]: [...(prev[contentType] || []), processedEvent],
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

  source.addEventListener('event', event => {
    console.log('[Spotlight] Received new event');
    const data = JSON.parse(event.data);
    dataCache.pushEvent(data);
  });

  source.addEventListener('open', () => {
    console.log('[Spotlight] open');
    // TODO: remove from datacache and useEffect instead
    dataCache.setOnline(true);
  });

  source.addEventListener('error', err => {
    dataCache.setOnline(false);
    // TODO: remove from datacache and useEffect instead
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
