import type { ReactNode } from "react";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { IS_ELECTRON } from "./isElectron";

interface RouterProps {
  children: ReactNode;
}

/**
 * Router that chooses the appropriate router based on the environment:
 * - BrowserRouter for standalone web apps (clean URLs)
 * - HashRouter for Electron apps (file:// protocol)
 *
 * HashRouter is required for Electron because:
 * - Electron loads from file:// protocol in production
 * - BrowserRouter requires HTML5 History API which doesn't work with file://
 * - HashRouter uses URL fragments (#/path) which work with any protocol
 */
export function Router({ children }: RouterProps) {
  if (IS_ELECTRON) {
    return <HashRouter>{children}</HashRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
}
