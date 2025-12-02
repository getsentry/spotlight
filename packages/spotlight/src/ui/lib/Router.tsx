import type { ReactNode } from "react";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { isElectron } from "./isElectron";

interface RouterProps {
  children: ReactNode;
}

/**
 * Router that chooses the appropriate router based on the environment:
 * - BrowserRouter for standalone web apps (clean URLs)
 * - HashRouter for Electron apps (file:// protocol)
 */
export function Router({ children }: RouterProps) {
  const inElectron = isElectron();

  if (inElectron) {
    return <HashRouter>{children}</HashRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
}
