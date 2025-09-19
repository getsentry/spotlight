# Spotlight Sidecar

The Spotlight Sidecar is a small proxy server that allows (development) servers to send data to Spotlight.

## Installation

```js
npm install @spotlightjs/sidecar
```

## Usage

### As a Library

```js
import { setupSidecar } from '@spotlightjs/sidecar';

// When you start your dev server
await setupSidecar();
```

### As a CLI

```bash
# Start with default settings (port 8969)
spotlight-sidecar

# Start on a custom port
spotlight-sidecar --port 3000
# or
spotlight-sidecar -p 3000

# Enable debug logging
spotlight-sidecar --debug
# or
spotlight-sidecar -d

# Combine options
spotlight-sidecar --port 3000 --debug

# Show help
spotlight-sidecar --help
```

### CLI Options

- `-p, --port <port>` - Port to listen on (default: 8969)
- `-d, --debug` - Enable debug logging
- `-h, --help` - Show help message

## MCP (Model Context Protocol) Integration

Spotlight Sidecar includes MCP tools for accessing local debugging data through Claude Code and other MCP clients.

### Available Tools

#### Error Debugging
- `get_local_errors` - Retrieve recent application errors with stack traces
- `get_local_logs` - Access application logs for behavior analysis

#### Performance & Tracing
- `get_local_traces` - List recent traces with performance summaries
- `get_events_for_trace` - Get detailed span tree and timing for specific traces

### Trace Viewing Workflow

1. **List Recent Traces**
   ```
   Use get_local_traces to see trace summaries:
   - Trace IDs (first 8 characters shown)
   - Root transaction names  
   - Duration and span counts
   - Error counts per trace
   - Timestamps for debugging specific periods
   ```

2. **Examine Specific Trace**
   ```
   Use get_events_for_trace with a trace ID:
   - Complete hierarchical span tree
   - Individual span durations and operations
   - Error context within trace timeline
   - Chronological flow of operations
   ```

### Prerequisites

To see trace data, ensure your application has:
- Sentry SDK with performance monitoring enabled
- Transaction instrumentation generating trace events
- Recent activity that creates spans (API calls, database queries, etc.)

### Example Usage

```bash
# Start sidecar with debug logging to see trace data flow
spotlight-sidecar --debug

# In Claude Code or MCP client:
# 1. List recent traces
get_local_traces(timeWindow: 300)

# 2. Get details for a specific trace
get_events_for_trace(traceId: "71a8c5e4")
```
