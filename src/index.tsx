import React from "react";
import ReactDOM from "react-dom/client";

import fontStyles from "@fontsource/raleway/index.css?inline";

import App from "./App.tsx";
import { SentryEvent } from "./types.ts";
import globalStyles from "./index.css?inline";
import dataCache from "./lib/dataCache.ts";

import type { Envelope, EnvelopeItem } from "@sentry/types";

const DEFAULT_RELAY = "http://localhost:8969/stream";

function createStyleSheet(styles: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);
  return sheet;
}

export function init({
  fullScreen = false,
  relay,
}: {
  fullScreen?: boolean;
  relay?: string;
} = {}) {
  if (typeof document === "undefined") return;

  connectToRelay(relay);

  // build shadow dom container to contain styles
  const docRoot = document.createElement("div");
  const shadow = docRoot.attachShadow({ mode: "open" });
  const appRoot = document.createElement("div");
  appRoot.style.position = "absolute";
  appRoot.style.top = "0";
  appRoot.style.left = "0";
  appRoot.style.right = "0";
  shadow.appendChild(appRoot);

  const ssGlobal = createStyleSheet(globalStyles);
  shadow.adoptedStyleSheets = [createStyleSheet(fontStyles), ssGlobal];

  if (import.meta.hot) {
    import.meta.hot.accept("./index.css?inline", (newGlobalStyles) => {
      ssGlobal.replaceSync(newGlobalStyles?.default);
    });
  }

  ReactDOM.createRoot(appRoot).render(
    <React.StrictMode>
      <App fullScreen={fullScreen} />
    </React.StrictMode>
  );

  window.addEventListener("load", () => {
    console.log("[spotlight] Injecting into application");

    document.body.append(docRoot);
  });
}

export function pushEvent(event: SentryEvent) {
  dataCache.pushEvent(event);
}

export function pushEnvelope(envelope: Envelope) {
  dataCache.pushEnvelope(envelope);
}

function connectToRelay(relay: string = DEFAULT_RELAY) {
  console.log("[Spotlight] Connecting to relay");
  const source = new EventSource(relay || DEFAULT_RELAY);

  source.addEventListener("envelope", (event) => {
    console.log("[Spotlight] Received new envelope");
    const [header, ...entries] = event.data.split("\n");
    const items: EnvelopeItem[] = [];
    for (let i = 0; i < entries.length; i += 2) {
      items.push([JSON.parse(entries[i]), JSON.parse(entries[i + 1])]);
    }
    dataCache.pushEnvelope([JSON.parse(header), items]);
  });

  source.addEventListener("event", (event) => {
    console.log("[Spotlight] Received new event");
    const data = JSON.parse(event.data);
    dataCache.pushEvent(data);
  });

  source.onerror = (err) => {
    console.error("EventSource failed:", err);
  };
}
