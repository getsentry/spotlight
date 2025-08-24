import { AsyncLocalStorage } from "node:async_hooks";
import type { ClientInfo } from "../mcp/types.js";

/**
 * Request-scoped context manager using AsyncLocalStorage
 * Provides clean context isolation without global state
 */
const contexts = new AsyncLocalStorage<ClientInfo>();

/**
 * Run a function within a client context
 * Uses AsyncLocalStorage for proper request isolation
 */
export function runWithClientContext<T>(clientInfo: ClientInfo, callback: () => Promise<T>): Promise<T>;
export function runWithClientContext<T>(clientInfo: ClientInfo, callback: () => T): T;
export function runWithClientContext<T>(clientInfo: ClientInfo, callback: () => T | Promise<T>): T | Promise<T> {
  return contexts.run(clientInfo, callback);
}

/**
 * Get the current request's client info
 * Returns undefined if no context is active
 */
export function getCurrentClient(): ClientInfo | undefined {
  return contexts.getStore();
}

/**
 * Get the current client or return a default
 */
export function getCurrentClientOrDefault(): ClientInfo {
  return (
    getCurrentClient() || {
      name: "unknown-client",
      transport: "http",
      userAgent: "mcp-client",
    }
  );
}
