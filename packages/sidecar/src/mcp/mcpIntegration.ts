import { SidecarEventProcessor } from './eventProcessor.js';
import { createSpotlightMcpServer } from './mcpServer.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
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
  private transport: StreamableHTTPServerTransport | null = null;
  private options: McpIntegrationOptions;

  constructor(options: McpIntegrationOptions = {}) {
    this.options = { enabled: true, ...options };
    this.eventProcessor = new SidecarEventProcessor();
    
    if (this.options.enabled) {
      this.mcpServer = createSpotlightMcpServer(this.eventProcessor);
      
      // Create StreamableHTTP transport with session management
      this.transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(), // Generate secure session IDs
        onsessioninitialized: (sessionId) => {
          logger.debug(`MCP session initialized: ${sessionId}`);
        }
      });
      
      // Connect server to transport
      this.mcpServer.connect(this.transport);
      
      logger.info('MCP integration initialized with StreamableHTTP transport');
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
   * HTTP request handler for MCP endpoints using StreamableHTTP transport
   */
  async handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!this.options.enabled || !this.transport) {
      res.writeHead(404);
      res.end('MCP server not enabled');
      return;
    }

    try {
      // Use StreamableHTTP transport to handle the request
      await this.transport.handleRequest(req, res);
    } catch (error) {
      logger.error('Failed to handle MCP request via transport:', error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    }
  }

  /**
   * Get MCP server for external use
   */
  getMcpServer() {
    return this.mcpServer;
  }

  /**
   * Get transport for external use
   */
  getTransport() {
    return this.transport;
  }

  /**
   * Close MCP integration
   */
  async close() {
    if (this.mcpServer) {
      await this.mcpServer.close();
    }
    logger.info('MCP integration closed');
  }
}