import type { z } from "zod";
import type { SidecarMcpInteractionType } from "./constants.js";
import type { EventSchema } from "./schema.js";

export type Event = z.infer<typeof EventSchema>;

export interface SidecarMcpInteraction {
  id: string;
  method: SidecarMcpInteractionType;
  tool?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  duration?: number;
  client: string;
  timestamp: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ClientInfo {
  name: string;
  version?: string;
  transport: "http" | "stdio" | "sse";
  userAgent?: string;
  ip?: string;
}
