import { ReactComponent as PenIcon } from "@spotlight/ui/assets/pen.svg";
import { useSpotlightContext } from "@spotlight/ui/lib/useSpotlightContext";
import type React from "react";
import { useCallback } from "react";

export default function OpenInEditor({ file }: { file: string }) {
  const { getSidecarUrl } = useSpotlightContext();
  const sidecarOpenUrl: string = getSidecarUrl("/open");

  const openInEditor = useCallback(
    (evt: React.MouseEvent) => {
      fetch(sidecarOpenUrl, {
        method: "POST",
        body: file,
        credentials: "omit",
      });
      evt.stopPropagation();
    },
    [file, sidecarOpenUrl],
  );
  return (
    <PenIcon
      width={18}
      height={18}
      title="Open in editor"
      className="stroke-primary-100 cursor-pointer"
      onClick={openInEditor}
    />
  );
}
