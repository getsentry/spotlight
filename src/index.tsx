import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { SentryEvent } from "./types.ts";

import globalStyles from "./index.css?inline";

export function init({
  relay,
  initialEvents = [],
}: {
  relay?: string;
  initialEvents?: SentryEvent[];
} = {}) {
  const docRoot = document.createElement("div");
  docRoot.style.position = "absolute";
  docRoot.style.top = "0";
  docRoot.style.left = "0";
  docRoot.style.right = "0";

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
      <App initialEvents={initialEvents} relay={relay} />
    </React.StrictMode>
  );

  window.addEventListener("load", () => {
    console.log("[spotlight] Injecting into application");

    document.body.append(docRoot);
  });
}
