// Detect CI environment at runtime (not replaced by build process)
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

export const sentryBaseConfig = {
  enabled: Boolean(process.env.NODE_ENV) && process.env.NODE_ENV !== "development",
  environment: isCI ? "github-ci" : process.env.NODE_ENV || "development",
  release: `spotlight@${process.env.npm_package_version}`,
  tracesSampleRate: 1,
  enableLogs: true,
} as const;
