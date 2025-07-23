import { SidecarEventProcessor } from './eventProcessor.js';
import { createSpotlightMcpServer } from './mcpServer.js';
import { logger } from '../logger.js';
import type { MessageBuffer } from '../messageBuffer.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Payload = [string, Buffer];

export interface McpIntegrationOptions {
  enabled?: boolean;
  tools?: {
    [toolName: string]: {
      enabled: boolean;
      permissions?: string[];
    };
  };
  resources?: {
    [resourceName: string]: {
      enabled: boolean;
      cacheTtl?: number;
    };
  };
  processing?: {
    enableStacktraceProcessing?: boolean;
    enableProfileProcessing?: boolean;
    memoryLimits?: {
      maxEvents?: number;
      maxTraces?: number;
      ttlHours?: number;
    };
  };
}

export class McpIntegration {
  private eventProcessor: SidecarEventProcessor;
  private mcpServer: ReturnType<typeof createSpotlightMcpServer> | null = null;
  private options: McpIntegrationOptions;

  constructor(options: McpIntegrationOptions = {}) {
    this.options = { enabled: true, ...options };
    this.eventProcessor = new SidecarEventProcessor();
    
    if (this.options.enabled) {
      this.mcpServer = createSpotlightMcpServer(this.eventProcessor);
      logger.info('MCP integration initialized with server');
    }
  }

  /**
   * Process incoming payload for MCP
   * This gets called when new data arrives in the MessageBuffer
   */
  async processPayload(contentType: string, data: Buffer): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      // Only process Sentry envelopes for now
      if (contentType === 'application/x-sentry-envelope') {
        await this.eventProcessor.processRawEvent({
          data: data,
          contentType: contentType
        });
      }
    } catch (error) {
      logger.error('Failed to process payload for MCP:', error);
    }
  }

  /**
   * Get the event processor for MCP server use
   */
  getEventProcessor(): SidecarEventProcessor {
    return this.eventProcessor;
  }

  /**
   * Subscribe to MessageBuffer updates
   * This integrates with the existing MessageBuffer system
   */
  subscribeToBuffer(buffer: MessageBuffer<Payload>): () => void {
    if (!this.options.enabled) {
      return () => {};
    }

    const subscription = buffer.subscribe(([contentType, data]) => {
      this.processPayload(contentType, data);
    });

    logger.debug('MCP integration subscribed to MessageBuffer');

    return () => {
      buffer.unsubscribe(subscription);
      logger.debug('MCP integration unsubscribed from MessageBuffer');
    };
  }

  /**
   * HTTP request handler for MCP endpoints
   */
  async handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!this.options.enabled || !this.mcpServer) {
      res.writeHead(404);
      res.end('MCP server not enabled');
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Allow': 'POST' });
      res.end('Method Not Allowed');
      return;
    }

    try {
      // Read request body
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString();

      // Parse MCP request
      const mcpRequest = JSON.parse(body);
      
      // Handle MCP request through the server
      const response = await this.mcpServer.handleRequest(mcpRequest);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (error) {
      logger.error('Failed to handle MCP request:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  /**
   * Get MCP server for external use
   */
  getMcpServer() {
    return this.mcpServer;
  }
}