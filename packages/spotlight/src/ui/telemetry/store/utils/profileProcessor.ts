import { graftProfileSpans } from "../../data/profiles";
import type {
  ProfileSample,
  SentryProfileEvent,
  SentryProfileTransactionInfo,
  Trace,
} from "../../types";
import type { SentryProfileWithTraceMeta } from "../types";
import { relativeNsToTimestamp } from "../utils";

export interface ProfileProcessingContext {
  tracesById: Map<string, Trace>;
}

export interface ProfileProcessingResult {
  profiles: Array<{
    traceId: string;
    profile: SentryProfileWithTraceMeta;
  }>;
}

/**
 * Processes a profile event and creates profile data for each transaction.
 * Handles profile grafting onto existing traces if available.
 */
export function processProfileEvent(
  event: SentryProfileEvent,
  context: ProfileProcessingContext,
): ProfileProcessingResult {
  const { tracesById } = context;
  const profiles: ProfileProcessingResult["profiles"] = [];

  // Ensure transactions array exists
  if (!event.transactions) {
    event.transactions = event.transaction ? [event.transaction] : [];
  }

  for (const txn of event.transactions) {
    // Skip string transaction IDs
    if (typeof txn === "string") continue;

    const profileTxn = txn as SentryProfileTransactionInfo;
    const trace = tracesById.get(profileTxn.trace_id);
    
    // Calculate timestamp
    const timestamp =
      trace && profileTxn.relative_start_ns != null
        ? relativeNsToTimestamp(
            trace.start_timestamp,
            profileTxn.relative_start_ns,
          )
        : event.timestamp;

    // Build profile data
    const profile: SentryProfileWithTraceMeta = {
      platform: event.platform,
      thread_metadata: event.profile.thread_metadata,
      samples: event.profile.samples.map((s: ProfileSample) => ({
        stack_id: s.stack_id,
        thread_id: s.thread_id,
        elapsed_since_start_ns: s.elapsed_since_start_ns,
        start_timestamp: relativeNsToTimestamp(
          timestamp,
          s.elapsed_since_start_ns,
        ),
      })),
      frames: event.profile.frames,
      stacks: event.profile.stacks.map((s) => Array.from(s).reverse()),
      timestamp,
      active_thread_id: profileTxn.active_thread_id,
    };

    profiles.push({
      traceId: profileTxn.trace_id,
      profile,
    });

    // Graft profile onto trace if it's ready
    // Avoid grafting partial traces (where we mocked start_timestamp from event timestamp)
    if (trace && trace.start_timestamp < trace.timestamp) {
      graftProfileSpans(trace, profile);
    }
  }

  return { profiles };
}

