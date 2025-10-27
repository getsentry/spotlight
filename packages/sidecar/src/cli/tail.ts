import type { ServerType } from "@hono/node-server";
import { captureException } from "@sentry/core";
import { EventSource } from "eventsource";
import { SENTRY_CONTENT_TYPE } from "../constants.js";
import {
  type FormatterFunction,
  type FormatterType,
  humanFormatters,
  jsonFormatters,
  logfmtFormatters,
  mdFormatters,
} from "../formatters/index.js";
import { logger } from "../logger.js";
import { setupSidecar } from "../main.js";
import type { ParsedEnvelope } from "../parser/index.js";
import type { CLIHandlerOptions } from "../types/cli.js";
import { getSpotlightURL } from "../utils/extras.js";
import { getBuffer } from "../utils/index.js";

export type OnItemCallback = (
  type: string,
  item: ParsedEnvelope["envelope"][1][number],
  envelopeHeader: ParsedEnvelope["envelope"][0],
) => boolean;
export const NAME_TO_TYPE_MAPPING: Record<string, string[]> = Object.freeze({
  traces: ["transaction", "span"],
  // profiles: ["profile"],
  logs: ["log"],
  attachments: ["attachment"],
  errors: ["event"],
  // sessions: ["session"],
  // replays: ["replay_video"],
  // client_report
});

const SUPPORTED_ENVELOPE_TYPES = new Set(Object.values(NAME_TO_TYPE_MAPPING).flat());
export const EVERYTHING_MAGIC_WORDS = new Set(["everything", "all", "*"]);
export const SUPPORTED_TAIL_ARGS = new Set([...Object.keys(NAME_TO_TYPE_MAPPING), ...EVERYTHING_MAGIC_WORDS]);

const FORMATTERS: Record<FormatterType, Map<string, FormatterFunction>> = {
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

export default async function tail(
  { port, cmdArgs, basePath, filesToServe, format = "logfmt" }: CLIHandlerOptions,
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

      // Get the formatter for this type
      const formatterFn = formatter.get(type);
      if (!formatterFn) {
        continue;
      }

      if (onItem && !onItem(type, item, envelopeHeader)) {
        continue;
      }

      formatted.push(...formatterFn(payload, envelope));
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

  const serverInstance = await setupSidecar({ port, filesToServe, basePath, isStandalone: true });

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
