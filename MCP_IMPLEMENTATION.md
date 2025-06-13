# MCP (Model Context Protocol) Server Implementation

This document describes the MCP server implementation added to the Spotlight Sidecar package.

## Overview

The Spotlight Sidecar now includes a Model Context Protocol (MCP) server that exposes event information through standardized tools and resources. This allows LLM applications to interact with Spotlight events using the MCP protocol.

## Features

### Tools

The MCP server provides the following tools for LLM interactions:

1. **get-events** - Retrieve event information
   - Parameters:
     - `contentType` (optional): Filter events by content type
     - `limit` (optional, default: 10): Maximum number of events to return
   - Returns: JSON array of events with metadata

2. **get-event-details** - Get detailed information about a specific event
   - Parameters:
     - `eventIndex` (required): Index of the event to retrieve
   - Returns: Detailed event data including full content

3. **get-event-stats** - Get statistics about stored events
   - Parameters: None
   - Returns: Statistics including total events, events by type, and total size

4. **clear-events** - Clear all stored events
   - Parameters: None
   - Returns: Confirmation message with count of cleared events

### Resources

The MCP server exposes the following resources:

1. **spotlight://events/all** - All current events in JSON format
2. **spotlight://events/type/{contentType}** - Events filtered by content type using a resource template

### Prompts

The server provides an analysis prompt:

1. **analyze-events** - Generate analysis prompts for event data
   - Parameters:
     - `contentType` (optional): Filter by content type
     - `analysisType` (optional): "summary", "errors", or "performance"
   - Returns: Structured prompt for LLM analysis

## Endpoint

The MCP server is available at `/mcp` on the same port as the main Sidecar server.

### Usage Examples

**GET Request for Server Information:**
```bash
curl http://localhost:8969/mcp
```

**POST Request for Tool Execution:**
```bash
curl -X POST http://localhost:8969/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get-events",
      "arguments": {
        "limit": 5
      }
    }
  }'
```

## Implementation Details

### Architecture

- **MCP Server Creation**: `createMcpServer()` function in `src/mcp-server.ts`
- **Integration**: MCP endpoint added to main server routes in `src/main.ts`
- **Data Access**: Uses existing `MessageBuffer` to access event data
- **Protocol**: Implements JSON-RPC 2.0 over HTTP

### Event Data Structure

Events are stored as `[contentType, Buffer]` tuples and exposed through MCP with the following structure:

```json
{
  "id": 0,
  "contentType": "application/x-sentry-envelope",
  "timestamp": "2025-06-13T11:30:00.000Z",
  "size": 1024,
  "preview": "First 200 characters of event data...",
  "data": "Full event data (for detailed requests)"
}
```

### Dependencies

- `@modelcontextprotocol/sdk`: MCP TypeScript SDK
- `zod`: Schema validation for tool parameters

## Integration with LLM Applications

The MCP server can be used by LLM applications that support the Model Context Protocol. It provides:

1. **Contextual Event Data**: LLMs can access real-time event information from applications being monitored by Spotlight
2. **Event Analysis**: Built-in prompts for analyzing patterns, errors, and performance issues
3. **Event Management**: Tools to clear events and get statistics

## Future Enhancements

Potential improvements for the MCP implementation:

1. **Real-time Updates**: Add support for streaming updates to subscribed clients
2. **Advanced Filtering**: More sophisticated event filtering and search capabilities
3. **Event Aggregation**: Tools for grouping and summarizing events
4. **Configuration**: User-configurable event retention and analysis settings
5. **Authentication**: Add security for sensitive event data

## Testing

The MCP server can be tested using:

1. **MCP Inspector**: Official testing tool for MCP servers
2. **Direct HTTP requests**: Using curl or similar tools
3. **Claude Desktop**: Can be configured to connect to the MCP server

Example Claude Desktop configuration:
```json
{
  "mcpServers": {
    "spotlight-sidecar": {
      "command": "curl",
      "args": ["-X", "POST", "http://localhost:8969/mcp"]
    }
  }
}
```

This MCP implementation enables seamless integration between Spotlight's event monitoring capabilities and LLM-powered analysis and debugging workflows.
