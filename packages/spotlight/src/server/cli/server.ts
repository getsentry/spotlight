import { setupSpotlight } from "../main.ts";
import type { CLIHandlerOptions } from "../types/cli.ts";

export default async function server({ port, basePath, filesToServe }: CLIHandlerOptions) {
  return await setupSpotlight({
    port,
    basePath,
    filesToServe,
    isStandalone: true,
  });
}
