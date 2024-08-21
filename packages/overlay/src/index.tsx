import fontStyles from '@fontsource/raleway/index.css?inline';
import { CONTEXT_LINES_ENDPOINT } from '@spotlightjs/sidecar/constants';
import { MemoryRouter } from 'react-router-dom';
import colors from 'tailwindcss/colors';
import App from './App.tsx';
import { DEFAULT_ANCHOR, DEFAULT_EXPERIMENTS, DEFAULT_SIDECAR_URL } from './constants.ts';
import globalStyles from './index.css?inline';
import { initIntegrations, type SpotlightContext } from './integrations/integration.ts';
import { default as sentry } from './integrations/sentry/index.ts';
import { off, on, trigger } from './lib/eventTarget.ts';
import { activateLogger, log } from './lib/logger.ts';
import { SpotlightContextProvider } from './lib/useSpotlightContext.tsx';
import { React, ReactDOM } from './react-instance.tsx'; // Import specific exports
import type { SpotlightOverlayOptions, WindowWithSpotlight } from './types.ts';

export { default as console } from './integrations/console/index.ts';
export { default as hydrationError } from './integrations/hydration-error/index.ts';
export { default as sentry } from './integrations/sentry/index.ts';
export { default as viteInspect } from './integrations/vite-inspect/index.ts';
export type { SpotlightOverlayOptions, WindowWithSpotlight } from './types.ts';
export {
  CONTEXT_LINES_ENDPOINT,
  DEFAULT_ANCHOR,
  DEFAULT_EXPERIMENTS,
  DEFAULT_SIDECAR_URL,
  React,
  ReactDOM,
  off,
  on,
  trigger,
};

function createStyleSheet(styles: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);
  return sheet;
}

/**
 * Open the Spotlight debugger Window
 */
export async function openSpotlight(path?: string | undefined) {
  trigger('open', { path });
}

/**
 * Close the Spotlight debugger Window
 */
export async function closeSpotlight() {
  trigger('close');
}

/**
 * Invokes the passed in callback when the Spotlight debugger Window is closed
 */
export async function onClose(cb: EventListener) {
  on('closed', cb);
}

/**
 * Invokes the passed in callback when the Spotlight debugger Window is opened
 */
export async function onOpen(cb: EventListener) {
  on('opened', cb);
}

/**
 * Register a callback that is invoked when a severe event is processed
 * by a Spotlight integration.
 * A count of the number of collected severe events is passed to the callback.
 */
export async function onSevereEvent(cb: (count: number) => void) {
  on('severeEventCount', e => {
    cb((e as CustomEvent).detail?.count ?? 1);
  });
}

function isSpotlightInjected() {
  const windowWithSpotlight = window as WindowWithSpotlight;
  if (windowWithSpotlight.__spotlight && window.document.getElementById('sentry-spotlight-root')) {
    return true;
  }
  return false;
}

export async function init({
  openOnInit = false,
  showTriggerButton = true,
  injectImmediately = false,
  sidecarUrl = DEFAULT_SIDECAR_URL,
  anchor = DEFAULT_ANCHOR,
  debug = false,
  integrations,
  experiments = DEFAULT_EXPERIMENTS,
  fullPage = false,
  showClearEventsButton = true,
  skipSidecar = false,
}: SpotlightOverlayOptions = {}) {
  // The undefined document guard is to avoid being initialized in a Worker
  // @see https://github.com/vitejs/vite/discussions/17644#discussioncomment-10026390
  if (typeof document === 'undefined') return;

  const finalExperiments = { ...DEFAULT_EXPERIMENTS, ...experiments };

  // We only want to initialize and inject spotlight once. If it's already
  // been initialized, we can just bail out.
  if (isSpotlightInjected()) return;

  if (debug) {
    activateLogger();
  }

  // Sentry is enabled by default
  const defaultIntegrations = [sentry({ sidecarUrl })];

  const context: SpotlightContext = {
    open: openSpotlight,
    close: closeSpotlight,
    experiments: finalExperiments,
  };

  const [initializedIntegrations] = await initIntegrations(integrations ?? defaultIntegrations, context);

  // build shadow dom container to contain styles
  const docRoot = document.createElement('div');
  docRoot.id = 'sentry-spotlight-root';
  const shadow = docRoot.attachShadow({ mode: 'open' });
  const appRoot = document.createElement('div');
  if (fullPage) {
    docRoot.style.height = '100%';
    docRoot.style.backgroundColor = colors.indigo[950];
    appRoot.style.height = 'inherit';
  } else {
    appRoot.style.position = 'absolute';
    appRoot.style.top = '0';
    appRoot.style.left = '0';
    appRoot.style.right = '0';
  }
  shadow.appendChild(appRoot);

  const ssGlobal = createStyleSheet(globalStyles);
  shadow.adoptedStyleSheets = [createStyleSheet(fontStyles), ssGlobal];

  if (import.meta.hot) {
    import.meta.hot.accept('./index.css?inline', newGlobalStyles => {
      ssGlobal.replaceSync(newGlobalStyles?.default);
    });
  }

  const tabs = initializedIntegrations.flatMap(
    integration =>
      integration.tabs?.({ processedEvents: [] }).map(tab => ({
        ...tab,
        processedEvents: [],
      })) || [],
  );

  const initialTab = tabs.length ? `/${tabs[0].id}` : '/no-tabs';

  ReactDOM.createRoot(appRoot).render(
    // <React.StrictMode>
    <MemoryRouter initialEntries={[initialTab]}>
      <SpotlightContextProvider context={context}>
        <App
          integrations={initializedIntegrations}
          openOnInit={openOnInit}
          showTriggerButton={showTriggerButton}
          sidecarUrl={sidecarUrl}
          anchor={anchor}
          fullPage={fullPage}
          showClearEventsButton={showClearEventsButton}
          skipSidecar={skipSidecar}
        />
      </SpotlightContextProvider>
    </MemoryRouter>,
    // </React.StrictMode>
  );

  function injectSpotlight() {
    if (isSpotlightInjected()) {
      log('Spotlight already injected, bailing.');
      return;
    }
    log('Injecting into application');
    document.body.append(docRoot);
  }

  if (document.readyState === 'complete' || injectImmediately) {
    injectSpotlight();
  } else {
    window.addEventListener('load', injectSpotlight);
  }
  window.addEventListener('error', injectSpotlight);
}
