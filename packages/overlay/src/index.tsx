import ReactDOM from 'react-dom/client';

import fontStyles from '@fontsource/raleway/index.css?inline';

import App from './App.tsx';
import { DEFAULT_ANCHOR, type Anchor } from './components/Trigger.tsx';
import globalStyles from './index.css?inline';
import type { Integration } from './integrations/integration.ts';
import { initIntegrations } from './integrations/integration.ts';
import { default as sentry } from './integrations/sentry/index.ts';
import { getSpotlightEventTarget } from './lib/eventTarget.ts';
import { activateLogger, log } from './lib/logger.ts';
import { WindowWithSpotlight } from './types.ts';

export { default as console } from './integrations/console/index.ts';
export { default as sentry } from './integrations/sentry/index.ts';
export { default as viteInspect } from './integrations/vite-inspect/index.ts';

function createStyleSheet(styles: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);
  return sheet;
}

/**
 * Open the Spotlight debugger Window
 */
export async function openSpotlight() {
  getSpotlightEventTarget().dispatchEvent(new CustomEvent('open'));
}

/**
 * Close the Spotlight debugger Window
 */
export async function closeSpotlight() {
  getSpotlightEventTarget().dispatchEvent(new CustomEvent('close'));
}

/**
 * Invokes the passed in callback when the Spotlight debugger Window is closed
 */
export async function onClose(cb: () => void) {
  getSpotlightEventTarget().addEventListener('closed', cb);
}

const DEFAULT_SIDECAR = 'http://localhost:8969/stream';

export async function init({
  fullScreen = false,
  showTriggerButton = true,
  integrations = [sentry()],
  defaultEventId,
  injectImmediately = false,
  sidecar = DEFAULT_SIDECAR,
  anchor = DEFAULT_ANCHOR,
  debug = false,
}: {
  integrations?: Integration[];
  fullScreen?: boolean;
  defaultEventId?: string;
  sidecarUrl?: string;
  showTriggerButton?: boolean;
  injectImmediately?: boolean;
  sidecar?: string;
  anchor?: Anchor;
  debug?: boolean;
} = {}) {
  if (typeof document === 'undefined') return;

  // We only want to intialize and inject spotlight once. If it's already
  // been initialized, we can just bail out.
  const windowWithSpotlight = window as WindowWithSpotlight;
  if (windowWithSpotlight.__spotlight) {
    return;
  }

  if (debug) {
    activateLogger();
  }
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
      showTriggerButton={showTriggerButton}
      sidecar={sidecar}
      anchor={anchor}
    />,
    // </React.StrictMode>
  );

  function injectSpotlight() {
    log('Injecting into application');
    document.body.append(docRoot);
  }

  if (injectImmediately) {
    injectSpotlight();
  } else {
    window.addEventListener('load', () => {
      injectSpotlight();
    });
  }
}
