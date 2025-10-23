import type { CLIHandlerOptions } from "src/types/cli.js";
import { setupSidecar } from "../main.js";

export default async function mcp({ port, basePath, filesToServe }: CLIHandlerOptions) {
  return await setupSidecar({
    port,
    basePath,
    filesToServe,
    isStandalone: true,
    stdioMCP: true,
  });
}
