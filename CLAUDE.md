# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start overlay and sidecar development servers
- `pnpm dev:overlay` - Start only overlay development
- `pnpm dev:website` - Start website development server
- `pnpm dev:electron` - Start electron app development

### Building
- `pnpm build` - Build all packages using Turbo
- `turbo build --filter=@spotlightjs/overlay` - Build specific package
- `turbo build --filter=./packages/*` - Build all packages

### Code Quality
- `pnpm lint` - Check code with Biome
- `pnpm lint:fix` - Fix auto-fixable linting issues
- `pnpm format` - Format code with Biome

### Testing
- `pnpm test` - Run package tests
- `pnpm test:demos` - Run demo application tests
- `pnpm test:e2e` - Run end-to-end tests
- **Note for LLMs**: Use `CI=true pnpm test` to disable Turbo's interactive TUI

### Package Management
- `pnpm clean` - Clean all dist folders
- `pnpm clean:deps` - Remove all node_modules
- `pnpm clean:all` - Full clean and reinstall

## Architecture Overview

Spotlight is a monorepo containing a development debugging overlay for Sentry. The project consists of several interconnected packages:

### Core Packages
- **overlay** (`@spotlightjs/overlay`) - React-based debug UI that displays Sentry events, traces, and logs in development
- **sidecar** (`@spotlightjs/sidecar`) - Node.js proxy server that captures data from backend services and forwards to overlay
- **spotlight** (`@spotlightjs/spotlight`) - Main package combining overlay + sidecar with Vite plugin

### Integration Packages
- **astro** - Astro framework integration
- **electron** - Electron app wrapper for standalone usage
- **website** - Documentation site built with Astro

### Key Architectural Patterns

#### Overlay Package Structure
- Integration-based plugin system in `src/integrations/`
- Each integration (sentry, console, etc.) has its own directory with components, hooks, and store
- Uses Zustand for state management and React Router for navigation
- Tailwind CSS with custom utilities for styling

#### Sidecar Package Structure
- Single HTTP server in `src/main.ts` with route-based handlers
- CORS middleware wrapper pattern for all endpoints
- Event buffering system in `messageBuffer.ts`
- Source code context handling in `contextlines.ts`

#### Build System
- **Turbo** for monorepo build orchestration and caching
- **Vite** for individual package bundling
- **Biome** for linting and formatting (replaces ESLint/Prettier)
- **TypeScript** with strict configuration and composite projects

## Development Patterns

### Component Development (Overlay)
- React components use TypeScript with inline prop types
- Tailwind CSS classes with custom `classNames()` utility
- Integration components go in `src/integrations/{name}/components/`
- Shared UI components in `src/ui/`

### Integration Development
Each integration follows this structure:
```
integrations/{name}/
├── index.ts          # Main integration implementation
├── types.ts          # Integration-specific types
├── components/       # React components
├── store/           # Zustand state management
└── utils/           # Utility functions
```

### Server Development (Sidecar)
- Route handlers use functional composition pattern
- All routes wrapped with CORS middleware
- No try/catch blocks in handlers - errors handled by middleware
- Custom logger with different levels

### Testing Strategy
- Vitest for unit tests
- E2E tests in separate packages with framework demos
- Integration tests preferred over unit tests
- Test files alongside source: `*.spec.ts`

## Reference Repositories

The `./git-repos/` folder contains cloned external repositories that are referenced during development:

### Model Context Protocol Integration
- **`modelcontextprotocol/`** - Official MCP specification and documentation repository
  - Contains the MCP protocol specification in multiple versions (2024-11-05, 2025-03-26, 2025-06-18, draft)
  - Schema definitions in TypeScript and JSON formats
  - Official documentation source for [modelcontextprotocol.io](https://modelcontextprotocol.io)
  - Community governance and contribution guidelines

- **`typescript-sdk/`** - Official MCP TypeScript SDK repository
  - Complete SDK for building MCP servers and clients
  - Support for multiple transports: stdio, Streamable HTTP, SSE
  - Authentication and OAuth integration features
  - Comprehensive examples and documentation
  - Build with `npm run build`, test with `npm test`

### MCP Integration Context
These repositories are referenced for potential or existing Model Context Protocol integration in Spotlight:
- MCP allows applications to provide context for LLMs in a standardized way
- The protocol separates context provision from LLM interaction
- May be used for extending Spotlight's debugging capabilities with LLM integration
- Related to the `external/` folder which contains MCP server implementations

When working with MCP-related features:
- Refer to the specification in `git-repos/modelcontextprotocol/docs/specification/`
- Use the TypeScript SDK examples in `git-repos/typescript-sdk/src/examples/`
- Follow MCP best practices for server/client implementation

## Important Notes

- Uses pnpm workspaces with strict package manager enforcement
- Node.js >= 22 required (see volta config)
- All packages are ESM-only (`"type": "module"`)
- Biome handles all linting, formatting, and import organization
- Pre-commit hooks run linting and formatting automatically