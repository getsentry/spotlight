/**
 * @spotlightjs/mcp - MCP server implementation for Spotlight debugging data
 *
 * This package provides Model Context Protocol (MCP) integration for Spotlight,
 * allowing LLMs to access debugging data from Sentry events, traces, and logs.
 */

export { McpIntegration, type McpIntegrationOptions } from "./mcpIntegration.js";
export { createSpotlightMcpServer } from "./mcpServer.js";
export { McpEventProcessor } from "./eventProcessor.js";
export type { ContextLinesHandler } from "./nodeCompatibilityLayer.js";
