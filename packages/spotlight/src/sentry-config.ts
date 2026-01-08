// Detect CI environment at runtime (not replaced by build process)
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

// Use build-time injected version for fossilized binaries, fallback to env var for npm/npx runs
declare const __SPOTLIGHT_VERSION__: string | undefined;
const version =
  typeof __SPOTLIGHT_VERSION__ !== "undefined" ? __SPOTLIGHT_VERSION__ : process.env.npm_package_version;

export const sentryBaseConfig = {
  enabled: Boolean(process.env.NODE_ENV) && process.env.NODE_ENV !== "development",
  environment: isCI ? "github-ci" : process.env.NODE_ENV || "development",
  release: `spotlight@${version}`,
  tracesSampleRate: 1,
  enableLogs: true,
} as const;
