#!/usr/bin/env node
require("dotenv").config();
const builder = require("electron-builder");

let mac = {
  target: [
    {
      target: "zip",
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
let afterSign = "scripts/notarize.js";

if (!process.env.CSC_LINK || !process.env.CSC_KEY_PASSWORD) {
  mac = {
    ...mac,
    target: [
      {
        target: "zip",
        arch: ["arm64"],
      },
    ],
    identity: null,
  };
  afterSign = undefined;
}

const config = {
  appId: "io.sentry.spotlight",
  productName: "Spotlight",
  asarUnpack: ["resources/**"],
  afterSign,
  npmRebuild: false,
  files: [
    "!**/.vscode/*",
    "!src/*",
    "!scripts/*",
    "!electron.vite.config.{js,ts,mjs,cjs}",
    "!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}",
    "!{.env,.env.*,.npmrc,pnpm-lock.yaml}",
    "!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}",
  ],
  mac,
  publish: {
    provider: "generic",
    url: "https://example.com/auto-updates",
  },
};

builder.build({ config });
