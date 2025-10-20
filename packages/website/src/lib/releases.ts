import * as Sentry from "@sentry/astro";

interface ReleaseInfo {
  version: string | null;
  tag: string;
  assets: Array<{ name: string; browser_download_url: string }>;
}

interface DownloadLink {
  platform: string;
  variant: string;
  name: string;
  url: string;
}

export async function getLatestRelease(): Promise<ReleaseInfo> {
  const empty: ReleaseInfo = { version: null, tag: "", assets: [] };

  try {
    const response = await fetch("https://api.github.com/repos/getsentry/spotlight/releases");
    if (!response.ok) return empty;

    const releases = await response.json();
    if (!Array.isArray(releases)) return empty;

    const desktopRelease = releases.find((release: any) =>
      release.assets?.some(
        (a: any) => a.name.endsWith(".dmg") || a.name.endsWith(".exe") || a.name.includes("spotlight-linux"),
      ),
    );

    if (!desktopRelease) return empty;

    const tagMatch = desktopRelease.tag_name?.match(/@([\d.]+)$/);
    const dmgAsset = desktopRelease.assets?.find((a: any) => a.name.match(/Spotlight-([\d.]+)\.dmg/));
    const dmgMatch = dmgAsset?.name.match(/Spotlight-([\d.]+)\.dmg/);
    const version = tagMatch?.[1] || dmgMatch?.[1] || null;

    return {
      version,
      tag: desktopRelease.tag_name,
      assets: desktopRelease.assets || [],
    };
  } catch (err) {
    Sentry.captureException(err);
    return empty;
  }
}

export function getDownloadLinks(assets: Array<{ name: string; browser_download_url: string }>): DownloadLink[] {
  const fallbackUrl = "https://github.com/getsentry/spotlight/releases";

  const macOSAppleSilicon = assets.find(a => a.name.includes("arm64") && a.name.endsWith(".dmg"));
  const macOSIntel = assets.find(
    a => a.name.includes("Spotlight-") && a.name.endsWith(".dmg") && !a.name.includes("arm64"),
  );
  const linuxX64 = assets.find(a => a.name.includes("linux-x64") && !a.name.endsWith(".zip"));
  const linuxArm64 = assets.find(a => a.name.includes("linux-arm64") && !a.name.endsWith(".zip"));
  const windowsX64 = assets.find(a => a.name.endsWith(".exe"));

  return [
    {
      platform: "macos",
      variant: "apple-silicon",
      name: "macOS",
      url: macOSAppleSilicon?.browser_download_url || fallbackUrl,
    },
    { platform: "macos", variant: "intel", name: "macOS", url: macOSIntel?.browser_download_url || fallbackUrl },
    { platform: "linux", variant: "x64", name: "Linux", url: linuxX64?.browser_download_url || fallbackUrl },
    { platform: "linux", variant: "arm64", name: "Linux", url: linuxArm64?.browser_download_url || fallbackUrl },
    { platform: "windows", variant: "x64", name: "Windows", url: windowsX64?.browser_download_url || fallbackUrl },
  ];
}
