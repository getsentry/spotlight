import { ReactComponent as PythonIcon } from "platformicons/svg/python.svg";
import { ReactComponent as JavaScriptIcon } from "platformicons/svg/javascript.svg";
import { ReactComponent as NodeIcon } from "platformicons/svg/nodejs.svg";
import { ReactComponent as DefaultIcon } from "platformicons/svg/default.svg";

import { ComponentPropsWithoutRef } from "react";

type Platform = "python" | "javascript" | "node" | string;

export default function PlatformIcon({
  platform,
  size = 42,
  ...props
}: ComponentPropsWithoutRef<"svg"> & {
  size?: number;
  platform?: Platform;
}) {
  switch (platform) {
    case "python":
      return <PythonIcon width={size} height={size} {...props} />;
    case "javascript":
      return <JavaScriptIcon width={size} height={size} {...props} />;
    case "node":
      return <NodeIcon width={size} height={size} {...props} />;
    default:
      return <DefaultIcon width={size} height={size} {...props} />;
  }
}
