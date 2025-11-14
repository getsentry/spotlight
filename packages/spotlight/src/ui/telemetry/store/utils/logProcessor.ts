import { generateUuidv4 } from "@spotlight/ui/lib/uuid";
import type { SentryLogEvent, SentryLogEventItem } from "../../types";
import { toTimestamp } from "../utils";

export interface LogProcessingResult {
  processedLogs: SentryLogEventItem[];
}

/**
 * Processes log items from a log event, normalizing and enriching them with metadata.
 * @param event The log event to process
 * @param existingLogIds Set of already processed log IDs to avoid duplicates
 * @returns Processed log items ready to be stored
 */
export function processLogItems(event: SentryLogEvent, existingLogIds: Set<string>): LogProcessingResult {
  const processedLogs: SentryLogEventItem[] = [];

  if (!event.items?.length) {
    return { processedLogs };
  }

  for (const logItem of event.items) {
    const logId = logItem.id || generateUuidv4();

    // Skip if already processed
    if (existingLogIds.has(logId)) {
      continue;
    }

    // Normalize severity number
    if (logItem.severity_number == null) {
      logItem.severity_number = 0;
    }

    // Extract SDK name from attributes
    logItem.sdk = logItem.attributes?.["sentry.sdk.name"]?.value as string;

    // Normalize timestamp
    logItem.timestamp = toTimestamp(logItem.timestamp);
    logItem.id = logId;

    processedLogs.push(logItem);
  }

  return { processedLogs };
}
