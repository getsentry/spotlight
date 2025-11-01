import type { ReactNode } from "react";
import { BrowserRouter, HashRouter } from "react-router-dom";

interface RouterProps {
  children: ReactNode;
}

/**
 * Router that chooses the appropriate router based on the environment:
 * - BrowserRouter for standalone web apps (clean URLs)
 * - HashRouter for Electron apps (file:// protocol)
 */
export function Router({ children }: RouterProps) {
  // Detect if we're running in Electron (file:// protocol)
  const isElectron = typeof window !== "undefined" && window.location.protocol === "file:";

  if (isElectron) {
    return <HashRouter>{children}</HashRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
}
