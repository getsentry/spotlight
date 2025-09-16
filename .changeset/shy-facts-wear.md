---
"@spotlightjs/sidecar": minor
---

Adds stdio based MCP server via a `--stdio-mcp` CLI argument. Also removes the context-based message buffers to be able to achieve this as there's no context-id for the stdio transport. This feature was not used anyway.
