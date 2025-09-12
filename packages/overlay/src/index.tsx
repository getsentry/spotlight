import fontStyles from "@fontsource/raleway/index.css?inline";
import { CONTEXT_LINES_ENDPOINT } from "@spotlightjs/sidecar/constants";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DEFAULT_INITIAL_TAB, DEFAULT_SIDECAR_STREAM_URL } from "./constants";
import globalStyles from "./index.css?inline";
import { on, trigger } from "./lib/eventTarget";
import initSentry from "./lib/instrumentation";
import { activateLogger, log } from "./lib/logger";
import { removeURLSuffix } from "./lib/removeURLSuffix";
import { SpotlightContextProvider } from "./lib/useSpotlightContext";
import { React, ReactDOM } from "./react-instance";
import type { WindowWithSpotlight } from "./types";

export type { WindowWithSpotlight } from "./types";
export { CONTEXT_LINES_ENDPOINT, DEFAULT_SIDECAR_STREAM_URL as DEFAULT_SIDECAR_URL, React, ReactDOM, trigger };

/**
 * Send an event to spotlight without the sidecar
 */
export async function sendEvent(contentType: string, data: string | Uint8Array) {
  trigger("event", { contentType, data });
}

/**
 * Register a callback that is invoked when a severe sentry event is processed.
 * A count of the number of collected severe events is passed to the callback.
 */
export async function onSevereEvent(cb: (count: number) => void) {
  on("severeEventCount", e => cb((e as CustomEvent).detail?.count ?? 1));
}

export type SpotlightInitOptions = {
  sidecarUrl?: string;
  showClearEventsButton?: boolean;
  debug?: boolean;
};

export async function init(initOptions: SpotlightInitOptions = {}) {
  // The undefined document guard is to avoid being initialized in a Worker
  // @see https://github.com/vitejs/vite/discussions/17644#discussioncomment-10026390
  if (typeof document === "undefined") return;

  const windowWithSpotlight = window as WindowWithSpotlight;
  if (windowWithSpotlight.__spotlight && document.getElementById("spotlight-root")) {
    log("Spotlight already initialized, skipping");
    return;
  }

  const {
    sidecarUrl = DEFAULT_SIDECAR_STREAM_URL,
    showClearEventsButton = true,
    debug = document.location.hash.endsWith("debug"),
  } = initOptions;

  if (debug) {
    activateLogger();
  }

  const sidecarBaseUrl = removeURLSuffix(sidecarUrl, "/stream");

  const appRoot = document.createElement("div");
  appRoot.id = "spotlight-root";
  appRoot.style.height = "100vh";
  appRoot.style.width = "100vw";

  // Add styles
  const styleElement = document.createElement("style");
  styleElement.textContent = `${fontStyles}\n${globalStyles}`;
  document.head.appendChild(styleElement);

  const isLoadedFromSidecar = new URL(sidecarUrl).origin === document.location.origin;
  if (isLoadedFromSidecar || document.location.hash.startsWith("#spotlight")) {
    initSentry();
  }

  const context = {
    sidecarUrl: sidecarBaseUrl,
  };

  function startApp() {
    if (document.getElementById("spotlight-root")) {
      log("Spotlight already rendered, skipping re-initialization");
      return;
    }

    document.body.innerHTML = "";
    document.body.appendChild(appRoot);

    ReactDOM.createRoot(appRoot).render(
      <BrowserRouter>
        <SpotlightContextProvider context={context}>
          <App sidecarUrl={sidecarUrl} showClearEventsButton={showClearEventsButton} />
        </SpotlightContextProvider>
      </BrowserRouter>,
    );
  }

  if (document.readyState === "complete") {
    startApp();
  } else {
    window.addEventListener("load", startApp);
  }
}
