require("dotenv").config();
const { notarize } = require("@electron/notarize");
const Sentry = require("@sentry/core");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: "io.sentry.spotlight",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    teamId: process.env.TEAMID,
  }).catch(error => {
    console.error(error);
    Sentry.captureException(error);
  });
};
