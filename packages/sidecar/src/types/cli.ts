import type { SideCarOptions } from "./utils.js";

export type CLIHandlerOptions = {
  cmd?: string;
  cmdArgs: string[];
  port: SideCarOptions["port"];
  help?: boolean;
  debug?: boolean;
  basePath?: SideCarOptions["basePath"];
  filesToServe?: SideCarOptions["filesToServe"];
};
export type CLIHandlerReturnType = Promise<any> | any;
export type CLIHandler = ((options: CLIHandlerOptions) => CLIHandlerReturnType) | (() => CLIHandlerReturnType);
