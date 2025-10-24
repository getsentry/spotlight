import { captureException } from "@sentry/core";
import { EventSource } from "eventsource";
import { SENTRY_CONTENT_TYPE } from "../constants.js";
import { formatEnvelope } from "../format/index.js";
import { logger } from "../logger.js";
import { setupSidecar } from "../main.js";
import type { ParsedEnvelope } from "../parser/processEnvelope.js";
import type { CLIHandlerOptions } from "../types/cli.js";
import { getSpotlightURL } from "../utils/extras.js";
import type { ServerType } from "@hono/node-server";

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

const SEPARATOR = Array(10).fill("─").join("");

function displayEnvelope(envelope: ParsedEnvelope["envelope"]) {
  console.log(`${envelope[0].event_id} | ${envelope[1][0][0].type} | ${envelope[0].sdk?.name}\n\n`);
  const lines = formatEnvelope(envelope);
  if (lines.length > 0) {
    console.log(lines.join("\n"));
  } else {
    console.log("No parser for the given event type");
  }
  console.log("\n");
  console.log(SEPARATOR);
}

const connectUpstream = async (port: number) =>
  new Promise<EventSource>((resolve, reject) => {
    const client = new EventSource(getSpotlightURL(port));
    client.onerror = reject;
    client.onopen = () => resolve(client);
  });

export default async function tail({
  port,
  cmdArgs,
  basePath,
  filesToServe,
}: CLIHandlerOptions): Promise<ServerType | undefined> {
  const eventTypes = cmdArgs.length > 0 ? cmdArgs.map(arg => arg.toLowerCase()) : ["everything"];
  for (const eventType of eventTypes) {
    if (!SUPPORTED_TAIL_ARGS.has(eventType)) {
      logger.error(`Error: Unsupported argument "${eventType}".`);
      logger.error(`Supported arguments are: ${[...SUPPORTED_TAIL_ARGS].join(", ")}`);
      process.exit(1);
    }
  }

  const types = eventTypes.some(type => EVERYTHING_MAGIC_WORDS.has(type))
    ? SUPPORTED_ENVELOPE_TYPES
    : new Set([...eventTypes.flatMap(type => NAME_TO_TYPE_MAPPING[type] || [])]);
  const onEnvelope: (envelope: ParsedEnvelope["envelope"]) => void = envelope => {
    if (envelope[1].some(([header]) => header.type && types.has(header.type))) {
      displayEnvelope(envelope);
    }
  };

  // try to connect to an already existing server first
  try {
    const client = await connectUpstream(port);
    client.addEventListener(SENTRY_CONTENT_TYPE, event => onEnvelope!(JSON.parse(event.data)));
  } catch (err) {
    // if we fail, fine then we'll start our own
    if (err instanceof Error && !err.message?.includes(port.toString())) {
      captureException(err);
      logger.error("Error when trying to connect to upstream sidecar:");
      logger.error(err);
      process.exit(1);
    }

    return await setupSidecar({ port, filesToServe, basePath, onEnvelope, isStandalone: true });
  }
}
