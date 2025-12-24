import { useEffect, useState } from "react";
import { IS_ELECTRON } from "./isElectron";

declare global {
  interface Window {
    __ELECTRON_IS_FULLSCREEN__?: boolean;
  }
}

/**
 * Hook to detect if the Electron app is in fullscreen mode.
 * Returns false when not in Electron or when not fullscreen.
 */
export function useElectronFullscreen(): boolean {
  const [isFullscreen, setIsFullscreen] = useState(IS_ELECTRON && window.__ELECTRON_IS_FULLSCREEN__ === true);

  useEffect(() => {
    if (!IS_ELECTRON) return;

    const handler = (event: CustomEvent<boolean>) => {
      setIsFullscreen(event.detail);
    };

    window.addEventListener("electron-fullscreen-change", handler as EventListener);
    return () => window.removeEventListener("electron-fullscreen-change", handler as EventListener);
  }, []);

  return isFullscreen;
}
