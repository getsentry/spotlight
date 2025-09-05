import type { Context } from "hono";
import type { ClientInfo } from "../mcp/types.js";
import type { HonoEnv } from "../utils.js";

/**
 * Interface for extracting client information from requests
 */
export interface ClientInfoExtractor {
  extractClientInfo(ctx: Context<HonoEnv>): ClientInfo;
}

/**
 * HTTP-specific implementation of client info extraction
 */
export class HttpClientInfoExtractor implements ClientInfoExtractor {
  extractClientInfo(ctx: Context<HonoEnv>): ClientInfo {
    const userAgent = ctx.req.header("User-Agent") || "mcp-client";

    return {
      name: this.extractClientName(ctx, userAgent),
      transport: "http" as const,
      userAgent,
      version: ctx.req.header("x-client-version") || undefined,
      ip: this.extractClientIp(ctx),
    };
  }

  private extractClientName(ctx: Context<HonoEnv>, userAgent: string): string {
    const strategies = [
      () => ctx.req.query("client"),
      () => ctx.req.header("x-client-id"),
      () => this.parseUserAgent(userAgent),
      () => this.generateIpBasedName(ctx),
      () => this.sanitizeUserAgent(userAgent),
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result && result !== "unknown") return result;
    }

    return "unknown";
  }

  private extractClientIp(ctx: Context<HonoEnv>): string | undefined {
    return (
      ctx.req.header("x-forwarded-for") ||
      ctx.req.header("cf-connecting-ip") ||
      ctx.req.header("x-real-ip") ||
      undefined
    );
  }

  private parseUserAgent(userAgent: string): string | null {
    if (userAgent === "mcp-client") return null;

    const userAgentMatch = userAgent.match(/^([^\/\s]+)/);
    return userAgentMatch?.[1]?.toLowerCase() || null;
  }

  private generateIpBasedName(ctx: Context<HonoEnv>): string | null {
    const forwardedFor = ctx.req.header("x-forwarded-for");
    if (forwardedFor) {
      return `client-${forwardedFor.split(",")[0]?.trim()}`;
    }

    const realIp = ctx.req.header("cf-connecting-ip") || ctx.req.header("x-real-ip");
    if (realIp && realIp !== "127.0.0.1") {
      return `client-${realIp}`;
    }

    return null;
  }

  private sanitizeUserAgent(userAgent: string): string {
    const sanitized = userAgent.replace(/[^\w\-\.]/g, "").substring(0, 20);
    return sanitized || "unknown";
  }
}
