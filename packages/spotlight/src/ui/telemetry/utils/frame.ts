import type { ColorValue } from "nanovis";
import { FRAME_COLOR } from "../constants/profile";
import type { EventFrame } from "../types";

/**
 * Checks if the current frame is an application frame based on the given platform.
 * @param frame The event frame to check.
 * @param platform The platform of the SDK that generated the profile.
 * @returns `true` if the frame is an application frame, `false` otherwise.
 */
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
      func.includes("node:") ||
      path.includes("webpack-internal:") ||
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

/**
 * Gets the color for a frame based on whether it's an application frame or a system frame.
 * It uses Sentry's color scheme.
 * @param frame The event frame to get the color for.
 * @param platform The platform of the SDK that generated the profile.
 * @returns The color value for the frame.
 * @see https://docs.sentry.io/product/explore/profiling/flame-charts-graphs/
 */
export const getFrameColors = (frame: EventFrame, platform?: string): ColorValue => {
  if (!frame.abs_path) return FRAME_COLOR.unknown;
  if (isApplicationFrame(frame, platform)) {
    return FRAME_COLOR.application;
  }
  return FRAME_COLOR.system;
};
