export function detectPlatform(): { platform: string; variant: string } | null {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) {
    return { platform: "macos", variant: "unknown" };
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
