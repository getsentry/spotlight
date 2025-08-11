# Spotlight MCP Evals

This package contains evaluation tests for the Spotlight MCP (Model Context Protocol) server tools.

## Overview

The evals use `vitest-evals` to test how AI models interact with the MCP tools provided by the Spotlight sidecar. These tests verify that natural language prompts correctly trigger the appropriate MCP tools.

## Structure

- `src/setup-env.ts` - Test environment setup that starts the sidecar server and MCP client
- `src/mcp/get_errors.eval.ts` - Tests for the `get_errors` MCP tool
- Test fixtures are imported from `@spotlightjs/test-fixtures`

## Running Tests

```bash
# Run all eval tests
pnpm eval

# Run in watch mode
pnpm eval:dev

# Run with coverage for CI
pnpm eval:ci
```

## How It Works

1. The setup file starts a real sidecar server on port 8970
2. It connects an MCP client to the server's `/mcp` endpoint
3. Tests send error data to the server via the `/stream` endpoint (SSE)
4. The `get_errors` tool is tested with various prompts to verify it triggers correctly
5. The tool returns formatted error messages from the buffer

## Test Cases

The `get_errors` tool should trigger for prompts like:
- "the page errored out"
- "show me the errors"
- "what went wrong with my app"
- "is there an error on the page"
- "debug the crash"

It should NOT trigger for prompts like:
- "how's the performance"
- "show me the network requests"
- "what's the current memory usage"

## Adding New Tests

To add tests for new MCP tools:

1. Create a new file in `src/mcp/[tool_name].eval.ts`
2. Use the `describeEval` function from `vitest-evals`
3. Define test cases with input prompts and expected tool calls
4. Use `ToolPredictionScorer` to verify the correct tools are predicted

## Note

The tests use the actual sidecar server and MCP implementation, not mocks. This ensures we're testing real behavior but requires the server to start successfully.