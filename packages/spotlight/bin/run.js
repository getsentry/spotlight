#!/usr/bin/env node
import { readFileSync } from "node:fs";
import Module from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setContext, startSpan } from "@sentry/node";
import { main } from "@spotlightjs/sidecar/cli";
import "./instrument.js";
const require = Module.createRequire(import.meta.url);
let sea = null;
try {
  // This is to maintain compatibility with Node 20.11- as
  // the `node:sea` module is added in Node 20.12+
  sea = require("node:sea");
} catch {
  sea = { isSea: () => false };
}

const homeDir = process.env.HOME || process.env.USERPROFILE;
setContext("CLI", {
  sea: sea.isSea(),
  // TODO: Be less naive with path obscuring
  argv: process.argv.map((arg) => arg.replace(homeDir, "~")),
});

const withTracing =
  (fn, spanArgs = {}) =>
  (...args) =>
    startSpan({ name: fn.name, attributes: { args }, ...spanArgs }, () =>
      fn(...args)
    );

const readAsset = withTracing(
  sea.isSea()
    ? (name) => Buffer.from(sea.getRawAsset(name))
    : (() => {
        const ASSET_DIR = join(
          fileURLToPath(import.meta.url),
          "../../dist/overlay/"
        );

        return (name) => readFileSync(join(ASSET_DIR, name));
      })(),
  { name: "readAsset", op: "cli.asset.read" }
);

startSpan({ name: "Spotlight CLI", op: "cli" }, async () => {
  await startSpan(
    { name: "Setup Sidecar", op: "cli.setup.sidecar" },
    async () => {
      const MANIFEST_NAME = "manifest.json";
      const ENTRY_POINT_NAME = "src/index.html";
      const filesToServe = Object.create(null);

      startSpan(
        { name: "Setup Server Assets", op: "cli.setup.sidecar.assets" },
        () => {
          // Following the guide here: https://vite.dev/guide/backend-integration.html
          const manifest = JSON.parse(readAsset(MANIFEST_NAME));
          filesToServe[ENTRY_POINT_NAME] = readAsset(ENTRY_POINT_NAME);
          const entries = Object.values(manifest);
          for (const entry of entries) {
            filesToServe[entry.file] = readAsset(entry.file);
          }
        }
      );

      await main({
        basePath: process.cwd(),
        filesToServe,
      });
    }
  );
});
