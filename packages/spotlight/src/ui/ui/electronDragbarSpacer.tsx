import { cn } from "@spotlight/ui/lib/cn";
import { ELECTRON_PLATFORM, IS_ELECTRON } from "@spotlight/ui/lib/isElectron";
import { useElectronFullscreen } from "@spotlight/ui/lib/useElectronFullscreen";

/**
 * A spacer component that adds 40px (h-10) height to account for the Electron
 * drag bar. Animates to 0 height when in fullscreen mode.
 */
export function ElectronDragbarSpacer({
  className,
  isAboveLogo = false,
}: { className?: string; isAboveLogo?: boolean }) {
  const isFullscreen = useElectronFullscreen();

  // Don't render at all outside Electron
  if (!IS_ELECTRON || (isAboveLogo && ELECTRON_PLATFORM !== "darwin")) {
    return null;
  }

  // Animate height transition in fullscreen
  return (
    <div
      className={cn(
        "overflow-hidden w-full transition-all duration-200 ease-out",
        isFullscreen ? "h-0" : "h-10",
        className,
      )}
    />
  );
}
