import { setupSidecar } from "../main.js";
import type { CLIHandlerOptions } from "../types/cli.js";

export default async function server({ port, basePath, filesToServe }: CLIHandlerOptions) {
  return await setupSidecar({
    port,
    basePath,
    filesToServe,
    isStandalone: true,
  });
}
