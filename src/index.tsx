import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { SentryEvent } from "./types.ts";

import globalStyles from "./index.css?inline";
import eventCache from "./lib/eventCache.ts";

import SpotlightIntegration from "./integration.ts";
export { SpotlightIntegration };

const DEFAULT_RELAY = "http://localhost:8969/stream";

export function init({
  relay,
}: {
  relay?: string;
} = {}) {
  if (typeof document === "undefined") return;

  connectToRelay(relay);

  const docRoot = document.createElement("div");

  const shadow = docRoot.attachShadow({ mode: "open" });
  const appRoot = document.createElement("div");
  appRoot.style.position = "absolute";
  appRoot.style.top = "0";
  appRoot.style.left = "0";
  appRoot.style.right = "0";
  shadow.appendChild(appRoot);

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(globalStyles);
  shadow.adoptedStyleSheets = [stylesheet];

  ReactDOM.createRoot(appRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  window.addEventListener("load", () => {
    console.log("[spotlight] Injecting into application");

    document.body.append(docRoot);
  });
}

export function pushEvent(event: SentryEvent) {
  eventCache.push(event);
}

function connectToRelay(relay: string = DEFAULT_RELAY) {
  console.log("[Spotlight] Connecting to relay");
  const source = new EventSource(relay || DEFAULT_RELAY);
  source.onmessage = (event) => {
    eventCache.push(JSON.parse(event.data));
  };
}
