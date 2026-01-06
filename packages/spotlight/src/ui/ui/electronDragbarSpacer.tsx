import { cn } from "@spotlight/ui/lib/cn";
import { IS_ELECTRON } from "@spotlight/ui/lib/isElectron";

/**
 * A spacer component that adds 40px (h-10) height to account for the Electron
 * drag bar. Uses CSS classes on body for state instead of JavaScript:
 * - body.electron-fullscreen: Collapses to h-0
 * - body.electron-darwin: Only shows when isAboveLogo on macOS
 */
export function ElectronDragbarSpacer({
  className,
  isAboveLogo = false,
}: { className?: string; isAboveLogo?: boolean }) {
  // Don't render at all outside Electron
  if (!IS_ELECTRON) {
    return null;
  }

  return (
    <div
      className={cn(
        "overflow-hidden w-full transition-all duration-200 ease-out h-10",
        // Collapse to h-0 when body has electron-fullscreen class
        "[body.electron-fullscreen_&]:h-0",
        // Hide on non-darwin platforms when above logo
        isAboveLogo && "[body:not(.electron-darwin)_&]:hidden",
        className,
      )}
    />
  );
}
