import type { ParsedEnvelope } from "../parser/processEnvelope.ts";
import type { NormalizedAllowedOrigins } from "../utils/cors.ts";

export type IncomingPayloadCallback = (body: string) => void;
export type OnEnvelopeCallback = (envelope: ParsedEnvelope["envelope"]) => void;

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
  port: number;

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

  /**
   * Additional origins to allow for CORS requests.
   * Useful for custom local domains, tunnels, etc.
   *
   * Accepts two formats:
   * - Full origins (e.g., "https://ngrok.io:443") for strict matching
   * - Plain domains (e.g., "myapp.local") to allow any protocol/port
   */
  allowedOrigins?: string[];
};

export type StartServerOptions = Pick<SideCarOptions, "basePath" | "filesToServe" | "incomingPayload"> & {
  port: number;
  /** Pre-normalized allowed origins for CORS (use normalizeAllowedOrigins() to create) */
  normalizedAllowedOrigins?: NormalizedAllowedOrigins;
};
