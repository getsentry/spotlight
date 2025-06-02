import fontStyles from "@fontsource/raleway/index.css?inline";
import { CONTEXT_LINES_ENDPOINT } from "@spotlightjs/sidecar/constants";
import { MemoryRouter } from "react-router-dom";
import colors from "tailwindcss/colors";
import App from "./App";
import {
  DEFAULT_ANCHOR,
  DEFAULT_EXPERIMENTS,
  DEFAULT_SIDECAR_STREAM_URL,
  SPOTLIGHT_OPEN_CLASS_NAME,
} from "./constants";
import globalStyles from "./index.css?inline";
import { type SpotlightContext, initIntegrations } from "./integrations/integration";
import { default as sentry } from "./integrations/sentry/index";
import { off, on, trigger } from "./lib/eventTarget";
import initSentry from "./lib/instrumentation";
import { activateLogger, log } from "./lib/logger";
import { removeURLSuffix } from "./lib/removeURLSuffix";
import { SpotlightContextProvider } from "./lib/useSpotlightContext";
import { React, ReactDOM } from "./react-instance";
import type { SpotlightOverlayOptions, WindowWithSpotlight } from "./types";

export { default as console } from "./integrations/console/index";
export { default as hydrationError } from "./integrations/hydration-error/index";
export { default as sentry } from "./integrations/sentry/index";
export { default as viteInspect } from "./integrations/vite-inspect/index";
export type { SpotlightOverlayOptions, WindowWithSpotlight } from "./types";
export {
  SPOTLIGHT_OPEN_CLASS_NAME,
  CONTEXT_LINES_ENDPOINT,
  DEFAULT_ANCHOR,
  DEFAULT_EXPERIMENTS,
  DEFAULT_SIDECAR_STREAM_URL as DEFAULT_SIDECAR_URL,
  off,
  on,
  React,
  ReactDOM,
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
  trigger("open", { path });
}

/**
 * Close the Spotlight debugger Window
 */
export async function closeSpotlight() {
  trigger("close");
}

/**
 * Invokes the passed in callback when the Spotlight debugger Window is closed
 */
export async function onClose(cb: EventListener) {
  on("closed", cb);
}

/**
 * Send an event to spotlight without the sidecar
 */
export async function sendEvent(contentType: string, data: string | Uint8Array) {
  trigger("event", { contentType, data });
}

/**
 * Invokes the passed in callback when the Spotlight debugger Window is opened
 */
export async function onOpen(cb: EventListener) {
  on("opened", cb);
}

/**
 * Register a callback that is invoked when a severe event is processed
 * by a Spotlight integration.
 * A count of the number of collected severe events is passed to the callback.
 */
export async function onSevereEvent(cb: (count: number) => void) {
  on("severeEventCount", e => cb((e as CustomEvent).detail?.count ?? 1));
}

function isSpotlightInjected() {
  const windowWithSpotlight = window as WindowWithSpotlight;
  if (windowWithSpotlight.__spotlight && window.document.getElementById("sentry-spotlight-root")) {
    return true;
  }
  return false;
}

export async function init(initOptions: SpotlightOverlayOptions = {}) {
  // The undefined document guard is to avoid being initialized in a Worker
  // @see https://github.com/vitejs/vite/discussions/17644#discussioncomment-10026390
  if (typeof document === "undefined") return;

  // We only want to initialize and inject spotlight once. If it's already
  // been initialized, we can just bail out.
  if (isSpotlightInjected()) return;

  let options = initOptions;
  const windowInitOptions = (window as WindowWithSpotlight).__spotlight?.initOptions;
  if (windowInitOptions) {
    options = {
      ...windowInitOptions,
      ...options,
    };
  }

  const {
    openOnInit = false,
    sidecarUrl = DEFAULT_SIDECAR_STREAM_URL,
    anchor = DEFAULT_ANCHOR,
    integrations,
    experiments = DEFAULT_EXPERIMENTS,
    showClearEventsButton = true,
    initialEvents = undefined,
    startFrom = undefined,
  } = options;

  const isLoadedFromSidecar = new URL(sidecarUrl).origin === document.location.origin;
  const sidecarBaseUrl: string = removeURLSuffix(sidecarUrl, "/stream");

  const fullPage = options.fullPage ?? isLoadedFromSidecar;
  const showTriggerButton = options.showTriggerButton ?? !fullPage;
  const injectImmediately = options.injectImmediately ?? (isLoadedFromSidecar || fullPage);
  const debug = options.debug ?? document.location.hash.endsWith("debug");

  if (debug) {
    activateLogger();
  }

  const finalExperiments = { ...DEFAULT_EXPERIMENTS, ...experiments };

  // Sentry is enabled by default
  const defaultIntegrations = () => [sentry({ injectIntoSDK: !isLoadedFromSidecar && !fullPage })];

  const context: SpotlightContext = {
    open: openSpotlight,
    close: closeSpotlight,
    experiments: finalExperiments,
    sidecarUrl: sidecarBaseUrl,
  };

  const [initializedIntegrations] = await initIntegrations(integrations ?? defaultIntegrations(), context);

  // build shadow dom container to contain styles
  const docRoot = document.createElement("div");
  docRoot.id = "sentry-spotlight-root";
  const shadow = docRoot.attachShadow({ mode: "open" });
  const appRoot = document.createElement("div");
  if (fullPage) {
    docRoot.style.height = "100%";
    docRoot.style.backgroundColor = colors.indigo[950];
    appRoot.style.height = "inherit";
  } else {
    appRoot.style.position = "absolute";
    appRoot.style.top = "0";
    appRoot.style.left = "0";
    appRoot.style.right = "0";
  }
  shadow.appendChild(appRoot);

  const ssGlobal = createStyleSheet(globalStyles);
  shadow.adoptedStyleSheets = [createStyleSheet(fontStyles), ssGlobal];

  if (import.meta.hot) {
    import.meta.hot.accept("./index.css?inline", newGlobalStyles => {
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

  const initialTab = startFrom || (tabs.length ? `/${tabs[0].id}` : "/no-tabs");
  log("Starting from", initialTab);

  // TODO: Shall we enable this for other cases too such as when we use it through Django SDK?
  if (fullPage && (isLoadedFromSidecar || document.location.hash.startsWith("#spotlight"))) {
    initSentry(initialTab, { debug });
  }

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
          initialEvents={initialEvents}
        />
      </SpotlightContextProvider>
    </MemoryRouter>,
    // </React.StrictMode>
  );

  function injectSpotlight() {
    if (isSpotlightInjected()) {
      log("Spotlight already injected, bailing.");
      return;
    }
    log("Injecting into application");

    const extraSheet = new CSSStyleSheet();
    extraSheet.replaceSync(`body.${SPOTLIGHT_OPEN_CLASS_NAME} { overflow: hidden!important; }`);
    // Combine the existing sheets and new one
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, extraSheet];

    document.body.append(docRoot);
  }

  if (document.readyState === "complete" || injectImmediately) {
    injectSpotlight();
  } else {
    window.addEventListener("load", injectSpotlight);
  }
  window.addEventListener("error", injectSpotlight);
}
