import ReactDOM from 'react-dom/client';

import fontStyles from '@fontsource/raleway/index.css?inline';

import App from './App.tsx';
import { DEFAULT_ANCHOR } from './components/Trigger.tsx';
import globalStyles from './index.css?inline';
import { initIntegrations } from './integrations/integration.ts';
import { default as sentry } from './integrations/sentry/index.ts';
import { getSpotlightEventTarget } from './lib/eventTarget.ts';
import { activateLogger, log } from './lib/logger.ts';
import { SpotlightOverlayOptions, WindowWithSpotlight } from './types.ts';

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

/**
 * Invokes the passed in callback when the Spotlight debugger Window is opened
 */
export async function onOpen(cb: () => void) {
  getSpotlightEventTarget().addEventListener('opened', cb);
}

/**
 * Register a callback that is invoked when a severe event is processed
 * by a Spotlight integration.
 * A count of the number of collected severe events is passed to the callback.
 */
export async function onSevereEvent(cb: (count: number) => void) {
  getSpotlightEventTarget().addEventListener('severeEventCount', e => {
    cb((e as CustomEvent).detail?.count ?? 1);
  });
}

const DEFAULT_SIDECAR_URL = 'http://localhost:8969/stream';

export async function init({
  fullScreen = false,
  showTriggerButton = true,
  defaultEventId,
  injectImmediately = false,
  sidecarUrl = DEFAULT_SIDECAR_URL,
  anchor = DEFAULT_ANCHOR,
  debug = false,
  integrations,
}: SpotlightOverlayOptions = {}) {
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

  // Sentry is enabled by default
  const defaultInitegrations = [sentry({ sidecarUrl })];

  const initializedIntegrations = await initIntegrations(integrations ?? defaultInitegrations);

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
      sidecarUrl={sidecarUrl}
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
