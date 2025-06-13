// Re-export everything from the refactored modules
export { setupSidecar, clearBuffer, shutdown, type SideCarOptions } from "./server.js";
export {
  type RequestHandler,
  withTracing,
  CORS_HEADERS,
  SPOTLIGHT_HEADERS,
  enableCORS,
  errorResponse,
  error404,
  error405,
  isValidPort,
  isSidecarRunning,
  getContentType,
  logSpotlightUrl,
  addServerTiming,
} from "./utils.js";
export {
  streamRequestHandler,
  fileServer,
  handleHealthRequest,
  handleClearRequest,
  openRequestHandler,
  createClearHandler,
  createFileServerHandler,
} from "./tools.js";
