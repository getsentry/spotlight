import { COMMANDS } from "../cli.ts";
import { AVAILABLE_FORMATTERS } from "../formatters/types.ts";
import type { CLIHandlerOptions } from "../types/cli.ts";

function showCommandHelp(commandName: string): boolean {
  const command = COMMANDS.find(c => c.meta.name === commandName);
  if (!command) {
    return false;
  }

  const { meta } = command;
  console.log(`
${meta.name} - ${meta.short}

Usage: ${meta.usage || `spotlight ${meta.name} [options]`}
${meta.long ? `\n${meta.long}` : ""}
${
  meta.examples && meta.examples.length > 0
    ? `
Examples:
${meta.examples.map(ex => `  ${ex}`).join("\n")}`
    : ""
}
`);
  return true;
}

function showMainHelp() {
  // Build commands section dynamically from COMMANDS
  const commandsHelp = COMMANDS.map(({ meta }) => {
    const name = meta.name.padEnd(20);
    return `  ${name} ${meta.short}`;
  }).join("\n");

  console.log(`
Spotlight Sidecar - Development proxy server for Spotlight

Usage: spotlight [command] [options]

Commands:
${commandsHelp}
  help                 Show this help message

Options:
  -p, --port <port>      Port to listen on (default: 8969, or 0 for random)
  -o, --open             Open the Spotlight dashboard in your default browser
  -d, --debug            Enable debug logging
  -f, --format <format>  Output format for tail command (default: human)
                         Available formats: ${[...AVAILABLE_FORMATTERS].join(", ")}
  -A, --allowed-origin <origin>
                         Additional origins to allow for CORS requests.
                         Can be specified multiple times or comma-separated.
                         Accepts full origins (https://example.com:443) for
                         strict matching or plain domains (myapp.local) to
                         allow any protocol/port.
  -h, --help             Show this help message

Examples:
${COMMANDS.flatMap(({ meta }) => meta.examples?.slice(0, 2) || [])
  .map(ex => `  ${ex}`)
  .join("\n")}

Run 'spotlight help <command>' for more information on a specific command.
`);
}

export default function showHelp({ cmdArgs }: CLIHandlerOptions) {
  const targetCmd = cmdArgs?.[0];

  if (targetCmd) {
    // Show detailed help for specific command
    if (!showCommandHelp(targetCmd)) {
      console.error(`Unknown command: ${targetCmd}`);
      console.error(`Run 'spotlight help' to see available commands.`);
      process.exit(1);
    }
  } else {
    // Show main help
    showMainHelp();
  }

  process.exit(0);
}
