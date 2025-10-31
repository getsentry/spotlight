<p align="center">
  <a href="https://blog.sentry.io/sentry-for-development/" target="_blank">
    <img src="https://raw.githubusercontent.com/getsentry/spotlight/main/.github/spotlight-hero-v2.jpg?utm_source=github&utm_medium=logo" alt="Spotlight">
  </a>
</p>

# What's Spotlight? [![npm version](https://img.shields.io/npm/v/@spotlightjs/spotlight.svg)](https://www.npmjs.com/package/@spotlightjs/spotlight)

Spotlight is Sentry for Development. Inspired by an old project, Django Debug Toolbar, Spotlight brings a rich debug
overlay into development environments, and it does it by leveraging the existing power of Sentry's SDKs.

## What You Can Do

- View real-time errors, traces, logs, and performance data from your applications
- Monitor multiple projects simultaneously in one place
- Stream and tail events with various output formats (human, logfmt, json, markdown)
- Run commands with automatic Spotlight integration
- Use the MCP server for AI development tools integration

## How to Use Spotlight

Spotlight offers two main ways to work with your development telemetry:

**Electron App (macOS)**: Download the standalone desktop application for a native experience.

**CLI** (`npx @spotlightjs/spotlight`): Run the command-line tool with multiple modes:
- Default mode starts a web UI server for viewing telemetry in your browser
- `spotlight tail [types...]` - stream events (errors, traces, logs, attachments) to your terminal with multiple formatters
- `spotlight run <command>` - run your application with Spotlight automatically configured
- `spotlight mcp` - start the MCP server for AI tool integration (stdio + HTTP)

## How It Works

Spotlight uses Sentry SDKs to capture telemetry data and sends it to the Sidecar, a local proxy server running on your machine. The Sidecar processes these events and forwards them to the UI, where you can view everything in real-time via the web interface or stream output to your terminal. Spotlight works standalone or alongside your existing Sentry setup without interference.

## Links

- [![Documentation](https://img.shields.io/badge/documentation-spotlight-indigo.svg)](https://spotlightjs.com/about/)
- [![Discord](https://img.shields.io/discord/621778831602221064)](https://discord.gg/EJjqM3XtXQ)
- [![Stack Overflow](https://img.shields.io/badge/stack%20overflow-sentry-green.svg)](http://stackoverflow.com/questions/tagged/sentry)
- [![Twitter Follow](https://img.shields.io/twitter/follow/getsentry?label=getsentry&style=social)](https://twitter.com/intent/follow?screen_name=getsentry)

## Resources

- [Contribute](https://spotlightjs.com/docs/contribute/)
- [Setup Spotlight](https://spotlightjs.com/docs/setup/)
- [Configuration](https://spotlightjs.com/docs/reference/configuration/)
- [Sidecar](https://spotlightjs.com/docs/sidecar/)
