import { cn } from "@spotlight/ui/lib/cn";
import { IS_ELECTRON } from "@spotlight/ui/lib/isElectron";
import { useElectronFullscreen } from "@spotlight/ui/lib/useElectronFullscreen";

/**
 * A spacer component that adds 40px (h-10) height to account for the Electron
 * drag bar. Only renders in Electron when NOT in fullscreen mode.
 */
export function ElectronDragbarSpacer({ className }: { className?: string }) {
  const isFullscreen = useElectronFullscreen();

  // Only render spacer in Electron when NOT fullscreen
  if (!IS_ELECTRON || isFullscreen) {
    return null;
  }

  return <div className={cn("h-10", className)} />;
}
