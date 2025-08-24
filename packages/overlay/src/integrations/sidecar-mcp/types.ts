export interface SidecarMcpInteraction {
  id: string;
  method: string;
  tool?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  duration?: number;
  client: string;
  timestamp: string;
  success: boolean;
  error?: string;
}
