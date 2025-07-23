import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SidecarEventProcessor } from './eventProcessor.js';
import { logger } from '../logger.js';

export function createSpotlightMcpServer(eventProcessor: SidecarEventProcessor) {
  const server = new McpServer(
    { name: 'spotlight-mcp', version: '1.0.0' },
    {
      capabilities: {
        tools: {},
        resources: {},
        logging: {}
      }
    }
  );
  
  // Rich error analysis tool using McpServer API
  server.registerTool('get-recent-errors', 
    {
      title: 'Get Recent Errors with Full Context',
      description: 'Get recent error events with stack traces, contexts, breadcrumbs, and related data',
      inputSchema: {
        count: z.number().optional().default(10).describe('Number of errors to fetch'),
        level: z.enum(['error', 'fatal']).optional().describe('Error severity level'),
        traceId: z.string().optional().describe('Filter by specific trace ID')
      }
    }, 
    async ({ count = 10, level, traceId }) => {
    const events = eventProcessor.getErrorEvents()
      .filter(event => {
        if (level && event.level !== level) return false;
        if (traceId && event.contexts?.trace?.trace_id !== traceId) return false;
        return true;
      })
      .slice(0, count);
    
    const enrichedErrors = events.map(event => ({
      id: event.event_id,
      message: event.exception?.values?.[0]?.value,
      type: event.exception?.values?.[0]?.type,
      stackTrace: event.exception?.values?.[0]?.stacktrace?.frames?.map(frame => ({
        filename: frame.filename,
        function: frame.function,
        lineno: frame.lineno,
        colno: frame.colno,
        context_line: frame.context_line,
        pre_context: frame.pre_context,
        post_context: frame.post_context
      })),
      contexts: event.contexts,
      breadcrumbs: event.breadcrumbs,
      tags: event.tags,
      user: event.user,
      timestamp: event.timestamp,
      environment: event.environment,
      release: event.release
    }));
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(enrichedErrors, null, 2)
      }]
    };
  });
  
  // Complete trace analysis tool using McpServer API
  server.registerTool('get-trace-analysis',
    {
      title: 'Get Complete Trace Analysis', 
      description: 'Get trace with span tree, performance metrics, and correlated data',
      inputSchema: {
        traceId: z.string().describe('Trace ID to analyze')
      }
    },
    async ({ traceId }) => {
    const trace = eventProcessor.getTraceById(traceId);
    if (!trace) {
      throw new Error(`Trace ${traceId} not found`);
    }
    
    const relatedEvents = eventProcessor.getEvents()
      .filter(event => event.contexts?.trace?.trace_id === traceId);
    
    const logs = eventProcessor.getLogsByTraceId(traceId);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          trace: {
            trace_id: trace.trace_id,
            status: trace.status,
            root_transaction: trace.rootTransactionName,
            span_count: trace.spans.size,
            error_count: trace.errors,
            duration_ms: trace.timestamp - trace.start_timestamp,
            start_timestamp: trace.start_timestamp,
            end_timestamp: trace.timestamp
          },
          span_tree: trace.spanTree.map(span => ({
            span_id: span.span_id,
            parent_span_id: span.parent_span_id,
            op: span.op,
            description: span.description,
            status: span.status,
            start_timestamp: span.start_timestamp,
            timestamp: span.timestamp,
            duration_ms: span.timestamp - span.start_timestamp,
            tags: span.tags
          })),
          related_events: relatedEvents.length,
          correlated_logs: logs.length,
          performance_issues: trace.spanTree
            .filter(span => (span.timestamp - span.start_timestamp) > 1000)
            .map(span => ({
              span_id: span.span_id,
              description: span.description,
              duration_ms: span.timestamp - span.start_timestamp,
              issue: 'Slow span (>1s)'
            }))
        }, null, 2)
      }]
    };
  });
  
  // Correlated debugging tool using McpServer API
  server.registerTool('debug-error-with-context',
    {
      title: 'Debug Error with Full Context',
      description: 'Get error with related trace, logs, and complete debugging context', 
      inputSchema: {
        errorId: z.string().describe('Error event ID')
      }
    },
    async ({ errorId }) => {
    const error = eventProcessor.getEventById(errorId);
    if (!error || !error.exception) {
      throw new Error(`Error ${errorId} not found`);
    }
    
    const traceId = error.contexts?.trace?.trace_id;
    const trace = traceId ? eventProcessor.getTraceById(traceId) : null;
    const logs = traceId ? eventProcessor.getLogsByTraceId(traceId) : [];
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: {
            id: error.event_id,
            message: error.exception.values?.[0]?.value,
            type: error.exception.values?.[0]?.type,
            stacktrace: error.exception.values?.[0]?.stacktrace,
            breadcrumbs: error.breadcrumbs,
            contexts: error.contexts,
            user: error.user,
            tags: error.tags
          },
          related_trace: trace ? {
            trace_id: trace.trace_id,
            status: trace.status,
            root_transaction: trace.rootTransactionName,
            span_count: trace.spans.size,
            duration_ms: trace.timestamp - trace.start_timestamp
          } : null,
          correlated_logs: logs.map(log => ({
            id: log.id,
            message: log.attributes?.message?.value,
            severity: log.severity_text,
            timestamp: log.timestamp,
            sdk: log.sdk
          })),
          debugging_suggestions: [
            trace && trace.errors > 1 ? 'Multiple errors in this trace - check for error cascade' : null,
            logs.length > 0 ? `${logs.length} log entries available for this trace` : null,
            error.breadcrumbs?.length ? `${error.breadcrumbs.length} breadcrumbs available showing user journey` : null
          ].filter(Boolean)
        }, null, 2)
      }]
    };
  });

  // List all available traces using McpServer API
  server.registerTool('list-traces',
    {
      title: 'List All Available Traces',
      description: 'Get a summary of all traces with basic metrics',
      inputSchema: {
        limit: z.number().optional().default(20).describe('Maximum number of traces to return')
      }
    },
    async ({ limit = 20 }) => {
    const traces = eventProcessor.getTraces().slice(0, limit);
    
    const traceSummaries = traces.map(trace => ({
      trace_id: trace.trace_id,
      root_transaction: trace.rootTransactionName,
      status: trace.status,
      span_count: trace.spans.size,
      error_count: trace.errors,
      duration_ms: trace.timestamp - trace.start_timestamp,
      start_timestamp: trace.start_timestamp
    }));
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total_traces: traces.length,
          traces: traceSummaries
        }, null, 2)
      }]
    };
  });

  // Add a simple debugging prompt
  server.registerPrompt('analyze-error',
    {
      title: 'Analyze Error',
      description: 'Generate a prompt to analyze a specific error with AI assistance',
      argsSchema: {
        errorId: z.string().describe('Error ID to analyze')
      }
    },
    async ({ errorId }) => {
      const error = eventProcessor.getEventById(errorId);
      if (!error || !error.exception) {
        throw new Error(`Error ${errorId} not found`);
      }

      const errorMessage = error.exception.values?.[0]?.value || 'Unknown error';
      const errorType = error.exception.values?.[0]?.type || 'Unknown type';
      const stackFrames = error.exception.values?.[0]?.stacktrace?.frames || [];
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please analyze this error and suggest potential causes and fixes:

Error Type: ${errorType}
Error Message: ${errorMessage}
Environment: ${error.environment || 'Unknown'}
Release: ${error.release || 'Unknown'}

Stack Trace (top 5 frames):
${stackFrames.slice(-5).map(frame => 
  `  at ${frame.function || '<anonymous>'} (${frame.filename}:${frame.lineno}:${frame.colno})`
).join('\n')}

${error.breadcrumbs?.length ? `\nRecent User Actions (${error.breadcrumbs.length} breadcrumbs available):\n${error.breadcrumbs.slice(-3).map(b => `- ${b.message || b.category}`).join('\n')}` : ''}

Please provide:
1. Likely root cause analysis
2. Specific code areas to investigate
3. Debugging steps to reproduce the issue
4. Suggested fixes or improvements`
            }
          }
        ]
      };
    }
  );

  // Add resource system for structured data access
  server.registerResource(
    'recent-errors',
    'spotlight://errors/recent',
    {
      title: 'Recent Errors',
      description: 'Recent error events with complete context',
      mimeType: 'application/json'
    },
    async () => {
      const errors = eventProcessor.getErrorEvents().slice(0, 10);
      const enrichedErrors = errors.map(event => ({
        id: event.event_id,
        message: event.exception?.values?.[0]?.value,
        type: event.exception?.values?.[0]?.type,
        timestamp: event.timestamp,
        environment: event.environment,
        release: event.release,
        contexts: event.contexts,
        breadcrumbs: event.breadcrumbs?.length || 0,
        stackFrames: event.exception?.values?.[0]?.stacktrace?.frames?.length || 0
      }));
      
      return {
        contents: [{
          uri: 'spotlight://errors/recent',
          text: JSON.stringify(enrichedErrors, null, 2),
          mimeType: 'application/json'
        }]
      };
    }
  );

  server.registerResource(
    'trace-list',
    'spotlight://traces/list',
    {
      title: 'Available Traces',
      description: 'List of all available traces with basic metrics',
      mimeType: 'application/json'
    },
    async () => {
      const traces = eventProcessor.getTraces().slice(0, 20);
      const traceSummaries = traces.map(trace => ({
        trace_id: trace.trace_id,
        root_transaction: trace.rootTransactionName,
        status: trace.status,
        span_count: trace.spans.size,
        error_count: trace.errors,
        duration_ms: trace.timestamp - trace.start_timestamp,
        start_timestamp: trace.start_timestamp
      }));
      
      return {
        contents: [{
          uri: 'spotlight://traces/list',
          text: JSON.stringify({ total_traces: traces.length, traces: traceSummaries }, null, 2),
          mimeType: 'application/json'
        }]
      };
    }
  );

  logger.info('MCP server created with rich debugging tools and resources');
  return server;
}