export const sentryBaseConfig = {
  enabled: Boolean(process.env.NODE_ENV) && process.env.NODE_ENV !== "development",
  environment: process.env.NODE_ENV || "development",
  release: `spotlight@${process.env.npm_package_version}`,
  tracesSampleRate: 1,
} as const;
