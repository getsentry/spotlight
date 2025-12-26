#!/usr/bin/env node
require("dotenv").config();
const builder = require("electron-builder");

let mac = {
  target: [
    {
      target: "default",
      arch: ["x64", "arm64"],
    },
  ],
  icon: "resources/icons/mac/icon.icns",
  hardenedRuntime: true,
  gatekeeperAssess: false,
  entitlements: "build/entitlements.mac.plist",
  entitlementsInherit: "build/entitlements.mac.plist",
  cscLink: process.env.CSC_LINK,
  cscKeyPassword: process.env.CSC_KEY_PASSWORD,
};
let afterSign = "scripts/notarize.cjs";

if (!process.env.CSC_LINK || !process.env.CSC_KEY_PASSWORD) {
  mac = {
    ...mac,
    target: [
      {
        target: "default",
        arch: ["arm64"],
      },
    ],
    identity: null,
  };
  afterSign = undefined;
}

builder.build({
  publish: "never",
  config: {
    appId: "io.sentry.spotlight",
    productName: "Spotlight",
    asarUnpack: ["resources/**"],
    afterSign,
    npmRebuild: false,
    extraMetadata: {
      main: "./dist-electron/main/index.js",
    },
    directories: {
      output: "dist-electron",
    },
    files: [
      "package.json",
      "dist-electron/main/**/*",
      "dist-electron/renderer/**/*",
      "resources/**/*",
    ],
    mac,
    publish: {
      provider: "github",
    },
  },
});
