---
"@spotlightjs/spotlight": patch
---

Add self-documenting CLI commands with per-command help support

Each CLI command now provides its own metadata (short description, usage, detailed help, and examples). The main help output is generated dynamically from this metadata, and users can get detailed help for specific commands via `spotlight help <command>` or `spotlight <command> --help`.

