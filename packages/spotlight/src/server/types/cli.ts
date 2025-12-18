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

export type CommandMeta = {
  name: string;
  short: string; // One-liner for main --help
  usage?: string; // e.g., "spotlight run [options] [command...]"
  long?: string; // Detailed description for command-specific help
  examples?: string[]; // Command-specific examples
};

export type Command = {
  meta: CommandMeta;
  handler: CLIHandler;
};
