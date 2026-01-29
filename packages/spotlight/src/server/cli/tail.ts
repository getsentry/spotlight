import type { ServerType } from "@hono/node-server";
import { captureException } from "@sentry/core";
import { metrics } from "@sentry/node";
import { EventSource } from "eventsource";
import { SENTRY_CONTENT_TYPE } from "../constants.ts";
import {
  type FormatterRegistry,
  type FormatterType,
  applyFormatter,
  humanFormatters,
  jsonFormatters,
  logfmtFormatters,
  mdFormatters,
} from "../formatters/index.ts";
import { logger } from "../logger.ts";
import { PortInUseError, setupSpotlight } from "../main.ts";
import type { ParsedEnvelope } from "../parser/index.ts";
import type { CLIHandlerOptions, Command, CommandMeta } from "../types/cli.ts";
import { getSpotlightURL } from "../utils/extras.ts";
import { getBuffer } from "../utils/index.ts";

export type OnItemCallback = (
  type: string,
  item: ParsedEnvelope["envelope"][1][number],
  envelopeHeader: ParsedEnvelope["envelope"][0],
) => boolean;
export const NAME_TO_TYPE_MAPPING: Record<string, string[]> = Object.freeze({
  traces: ["transaction", "span"],
  // profiles: ["profile"],
  logs: ["log"],
  metrics: ["trace_metric"],
  attachments: ["attachment"],
  errors: ["event"],
  // sessions: ["session"],
  // replays: ["replay_video"],
  // client_report
});

const SUPPORTED_ENVELOPE_TYPES = new Set(Object.values(NAME_TO_TYPE_MAPPING).flat());
export const EVERYTHING_MAGIC_WORDS = new Set(["everything", "all", "*"]);
export const SUPPORTED_TAIL_ARGS = new Set([...Object.keys(NAME_TO_TYPE_MAPPING), ...EVERYTHING_MAGIC_WORDS]);

export const meta: CommandMeta = {
  name: "tail",
  short: `Tail Sentry events (types: ${Object.keys(NAME_TO_TYPE_MAPPING).join(", ")})`,
  usage: "spotlight tail [types...] [options]",
  long: `Stream Sentry events to your terminal in real-time.

Available event types:
  ${Object.keys(NAME_TO_TYPE_MAPPING).join(", ")}

Magic words (to tail everything):
  ${[...EVERYTHING_MAGIC_WORDS].join(", ")}

Use -f/--format to change output format (human, logfmt, json, md).
Connects to existing sidecar if running, otherwise starts a new one.`,
  examples: [
    "spotlight tail                     # Tail all event types (human format)",
    "spotlight tail errors              # Tail only errors",
    "spotlight tail errors logs         # Tail errors and logs",
    "spotlight tail --format json       # Use JSON output format",
    "spotlight tail traces -f logfmt    # Tail traces with logfmt format",
  ],
};

const FORMATTERS: Record<FormatterType, FormatterRegistry> = {
  md: mdFormatters,
  logfmt: logfmtFormatters,
  json: jsonFormatters,
  human: humanFormatters,
};

const connectUpstream = async (port: number) =>
  new Promise<EventSource>((resolve, reject) => {
    const client = new EventSource(getSpotlightURL(port));
    client.onerror = reject;
    client.onopen = () => resolve(client);
  });

export async function handler(
  { port, cmdArgs, basePath, filesToServe, format = "logfmt", allowedOrigins }: CLIHandlerOptions,
  onItem?: OnItemCallback,
): Promise<ServerType | undefined> {
  const eventTypes = cmdArgs.length > 0 ? cmdArgs.map(arg => arg.toLowerCase()) : ["everything"];
  for (const eventType of eventTypes) {
    if (!SUPPORTED_TAIL_ARGS.has(eventType)) {
      logger.error(`Error: Unsupported argument "${eventType}".`);
      logger.error(`Supported arguments are: ${[...SUPPORTED_TAIL_ARGS].join(", ")}`);
      process.exit(1);
    }
  }

  // Track which event types users tail
  for (const eventType of eventTypes) {
    metrics.count("cli.tail.event_type", 1, { attributes: { type: eventType } });
  }

  const formatter = FORMATTERS[format];
  const types = eventTypes.some(type => EVERYTHING_MAGIC_WORDS.has(type))
    ? SUPPORTED_ENVELOPE_TYPES
    : new Set([...eventTypes.flatMap(type => NAME_TO_TYPE_MAPPING[type] || [])]);
  const onEnvelope: (envelope: ParsedEnvelope["envelope"]) => void = envelope => {
    const [envelopeHeader, items] = envelope;
    const formatted: string[] = [];

    for (const item of items) {
      const [{ type }, payload] = item;

      if (!type || !types.has(type)) {
        // Skip if not a type we're interested in
        continue;
      }

      // Check if this event type is supported by the formatter
      if (!(type in formatter)) {
        continue;
      }

      if (onItem && !onItem(type, item, envelopeHeader)) {
        continue;
      }

      formatted.push(...applyFormatter(formatter, type as keyof FormatterRegistry, payload, envelopeHeader));
    }

    if (formatted.length > 0) {
      console.log(formatted.join("\n"));
    }
  };

  // try to connect to an already existing server first
  try {
    const client = await connectUpstream(port);
    client.addEventListener(SENTRY_CONTENT_TYPE, event => onEnvelope!(JSON.parse(event.data)));
    // Early return - don't start our own server if we can connect to an upstream one
    return undefined;
  } catch (err) {
    // if we fail, fine then we'll start our own
    if (err instanceof Error && !err.message?.includes(port.toString())) {
      captureException(err);
      logger.error("Error when trying to connect to upstream sidecar:");
      logger.error(err);
      process.exit(1);
    }
  }

  let serverInstance: ServerType | undefined;
  try {
    serverInstance = await setupSpotlight({ port, filesToServe, basePath, isStandalone: true, allowedOrigins });
  } catch (err) {
    if (err instanceof PortInUseError) {
      logger.error(err.message);
      process.exit(1);
    }
    throw err; // Re-throw other errors (keeps normal behavior)
  }

  // Subscribe the onEnvelope callback to the message buffer
  // This ensures it gets called whenever any envelope is added to the buffer
  getBuffer().subscribe(container => {
    const parsedEnvelope = container.getParsedEnvelope();
    if (parsedEnvelope) {
      onEnvelope(parsedEnvelope.envelope);
    }
  });

  return serverInstance;
}

export default { meta, handler } satisfies Command;
