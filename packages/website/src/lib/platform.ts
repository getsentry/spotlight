export function detectPlatform(): { platform: string; variant: string } | null {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) {
    const isAppleSilicon =
      ua.includes("arm") ||
      ((navigator as any).userAgentData?.platform === "macOS" &&
        (navigator as any).userAgentData?.architecture === "arm");

    return { platform: "macos", variant: isAppleSilicon ? "apple-silicon" : "intel" };
  }

  if (ua.includes("win")) return { platform: "windows", variant: "x64" };
  if (ua.includes("linux")) {
    const isArm = ua.includes("arm") || ua.includes("aarch64");
    return { platform: "linux", variant: isArm ? "arm64" : "x64" };
  }
  return null;
}

export function isMobile(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|tablet|mobile/i;
  return mobileRegex.test(ua);
}
