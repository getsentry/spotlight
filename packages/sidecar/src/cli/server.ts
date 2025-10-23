import { setupSidecar } from "../main.js";
import type { CLIHandlerOptions } from "../types/cli.js";

export default async function startServer({ port, basePath, filesToServe }: CLIHandlerOptions) {
  return await setupSidecar({
    port,
    basePath,
    filesToServe,
    isStandalone: true,
  });
}
