import type { ParsedEnvelope } from "~/parser/processEnvelope.js";

export type IncomingPayloadCallback = (body: string) => void;
export type OnEnvelopeCallback = (envelope: ParsedEnvelope["event"]) => void;

export type SidecarLogger = {
  info: (message: any) => void;
  warn: (message: any) => void;
  error: (message: any) => void;
  debug: (message: any) => void;
};

export type SideCarOptions = {
  /**
   * The port on which the sidecar should listen.
   * Defaults to 8969.
   */
  port?: string | number;

  /**
   * A logger that implements the SidecarLogger interface.
   * Use this to inject your custom logger implementation.
   *
   * @default - a simple logger logging to the console.
   */
  logger?: SidecarLogger;

  /**
   * The base path from where the static files should be served.
   */
  basePath?: string;

  filesToServe?: Record<string, Buffer>;

  /**
   * More verbose logging.
   */
  debug?: boolean;

  /**
   * A callback that will be called with the incoming message.
   * Helpful for debugging.
   */
  incomingPayload?: IncomingPayloadCallback;

  /**
   * A callback that will be called with the parsed envelope every
   * time an envelope is received. This will me mainly used for the
   * CLI for streaming data but can be used by other tools as well.
   */
  onEnvelope?: OnEnvelopeCallback;

  isStandalone?: boolean;

  stdioMCP?: boolean;
};

export type StartServerOptions = Pick<
  SideCarOptions,
  "basePath" | "filesToServe" | "incomingPayload" | "onEnvelope" | "stdioMCP"
> & {
  port: number;
};
