import type { FormatterType } from "../formatters/types.ts";
import type { SideCarOptions } from "./utils.ts";

export type CLIHandlerOptions = {
  cmd?: string;
  cmdArgs: string[];
  port: SideCarOptions["port"];
  help?: boolean;
  debug?: boolean;
  open?: boolean;
  format?: FormatterType;
  basePath?: SideCarOptions["basePath"];
  filesToServe?: SideCarOptions["filesToServe"];
  allowedOrigins?: SideCarOptions["allowedOrigins"];
};
export type CLIHandlerReturnType = Promise<any> | any;
export type CLIHandler = ((options: CLIHandlerOptions) => CLIHandlerReturnType) | (() => CLIHandlerReturnType);
