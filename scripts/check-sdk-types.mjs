import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const packageDirectory = fileURLToPath(new URL("../packages/spotlight/", import.meta.url));
const require = createRequire(import.meta.url);
const tsc = require.resolve("typescript/bin/tsc");
for (const entry of ["core", "node"]) {
  for (const extension of ["js", "d.ts"]) {
    try {
      await access(join(packageDirectory, "dist", "sdk", `${entry}.${extension}`));
    } catch {
      throw new Error("Build the Spotlight Node and UI packages before running test:sdk-types");
    }
  }
}

function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: packageDirectory, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`SDK check failed (${result.status ?? result.signal})`);
}

// These resolve the published export map and emitted declarations, with no source aliases.
run(tsc, ["--project", "tests/types/tsconfig.sdk-core.json"]);
run(tsc, ["--project", "tests/types/tsconfig.sdk-node.json"]);
const temporary = await mkdtemp(join(tmpdir(), "spotlight-sdk-examples-"));
try {
  run(tsc, ["--project", "examples/sdk/tsconfig.json", "--outDir", temporary]);
  await writeFile(join(temporary, "package.json"), '{"type":"module"}\n');
  const scope = join(temporary, "node_modules", "@spotlightjs");
  await mkdir(scope, { recursive: true });
  await symlink(packageDirectory, join(scope, "spotlight"), "junction");
  run(join(temporary, "lifecycle.js"));
  console.log("Built SDK declarations, consumer contracts, and executable examples passed.");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
