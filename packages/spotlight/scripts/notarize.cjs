require("dotenv").config();
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: "io.sentry.spotlight",
    appPath: `${appOutDir}/${appName}.app`,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiKey: process.env.APPLE_API_KEY,
    appleApiIssuer: process.env.APPLE_API_ISSUER,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
