// Simple logger utility for MCP package
export const logger = {
  debug: (...args: any[]) => console.debug("[MCP]", ...args),
  info: (...args: any[]) => console.info("[MCP]", ...args),
  warn: (...args: any[]) => console.warn("[MCP]", ...args),
  error: (...args: any[]) => console.error("[MCP]", ...args),
};
