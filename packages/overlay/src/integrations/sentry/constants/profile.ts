import type { EventFrame } from "../types";

export const FRAME_COLOR = {
  application: "#d0d1f5",
  system: "#ffe0e4",
  unknown: "#f3f4f6",
};

export const FRAME_COLOR_CLASS = {
  application: "bg-[#d0d1f5]",
  system: "bg-[#ffe0e4]",
  default: "bg-[#f3f4f6]",
};

export const FRAMER_TYPES = [
  { label: "Application Frame", color: FRAME_COLOR_CLASS.application },
  { label: "System Frame", color: FRAME_COLOR_CLASS.system },
];

export const isApplicationFrame = (frame: EventFrame, platform?: string) => {
  if (frame.in_app !== undefined) {
    return frame.in_app;
  }

  const path = frame.abs_path?.toLowerCase() || "";
  const func = frame.function?.toLowerCase() || "";

  const fallback =
    !path.includes("node_modules") &&
    !path.includes("/gems/") &&
    !path.includes("vendor/") &&
    !path.includes("lib/python");

  if (!platform) {
    return fallback;
  }

  if (platform.startsWith("javascript")) {
    return !(
      path.includes("node_modules") ||
      func.includes("node::") ||
      path.includes("webpack-internal") ||
      path.includes("<anonymous>")
    );
  }

  if (platform.startsWith("python")) {
    return !path.includes("lib/python");
  }

  if (platform.startsWith("java")) {
    return !(
      func.startsWith("java.") ||
      func.startsWith("javax.") ||
      func.startsWith("sun.") ||
      func.startsWith("com.android")
    );
  }

  if (platform.startsWith("php")) {
    return !path.includes("vendor/");
  }

  if (platform.startsWith("ruby")) {
    return !path.includes("/gems/");
  }

  if (platform.startsWith("dotnet")) {
    return !(func.startsWith("system.") || func.startsWith("microsoft."));
  }

  return fallback;
};
