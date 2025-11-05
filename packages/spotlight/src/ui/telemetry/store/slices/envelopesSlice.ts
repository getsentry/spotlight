import type { Envelope } from "@sentry/core";
import type { StateCreator } from "zustand";
import { RAW_TYPES } from "../../../../shared/constants";
import { ATTACHMENT_EVENT_TYPES, SUPPORTED_EVENT_TYPES } from "../../constants/sentry";
import type { EventAttachment, Sdk, SentryEvent } from "../../types";
import { sdkToPlatform } from "../../utils/sdkToPlatform";
import type { EnvelopesSliceActions, EnvelopesSliceState, SentryStore } from "../types";

const initialEnvelopesState: EnvelopesSliceState = {
  envelopes: new Map(),
};

export const createEnvelopesSlice: StateCreator<SentryStore, [], [], EnvelopesSliceState & EnvelopesSliceActions> = (
  set,
  get,
) => ({
  ...initialEnvelopesState,
  pushEnvelope: (envelope: Envelope) => {
    const [header, items] = envelope;
    const lastSeen = new Date(header.sent_at as string).getTime();
    let sdk: Sdk;

    if (header.sdk?.name && header.sdk.version) {
      sdk = {
        name: header.sdk.name,
        version: header.sdk.version,
        lastSeen: lastSeen,
      };
    } else if (items.length > 0) {
      sdk = get().inferSdkFromEvent(items[0][1] as SentryEvent);
    } else {
      sdk = {
        name: "unknown",
        version: "0.0.0",
        lastSeen,
      };
    }

    get().storeSdkRecord(sdk);

    const traceContext = header.trace;

    const attachmentsByEventId = new Map<string, EventAttachment[]>();
    const envelopeScopedAttachments: EventAttachment[] = [];
    let eventCount = 0;

    for (const [itemHeader, itemData] of items) {
      if (SUPPORTED_EVENT_TYPES.has(itemHeader.type)) {
        eventCount += 1;
      }

      if (!ATTACHMENT_EVENT_TYPES.has(itemHeader.type)) {
        continue;
      }

      const rawData = (itemData as { data?: unknown })?.data;
      if (typeof rawData !== "string") {
        continue;
      }

      const attachment: EventAttachment = {
        header: itemHeader,
        data: rawData,
      };

      const eventId = "event_id" in itemHeader ? (itemHeader.event_id as string | undefined) : undefined;

      if (eventId) {
        const existing = attachmentsByEventId.get(eventId) ?? [];
        existing.push(attachment);
        attachmentsByEventId.set(eventId, existing);
      } else {
        envelopeScopedAttachments.push(attachment);
      }
    }

    for (const [itemHeader, itemData] of items) {
      if (SUPPORTED_EVENT_TYPES.has(itemHeader.type)) {
        const item = itemData as SentryEvent;
        if (!RAW_TYPES.has(itemHeader.type)) {
          item.platform = sdkToPlatform(sdk.name);
        }
        if (traceContext) {
          if (!item.contexts) {
            item.contexts = {};
          }
          item.contexts.trace ??= traceContext;
        }
        const eventId =
          item.event_id ?? ("event_id" in itemHeader ? (itemHeader.event_id as string | undefined) : undefined);
        let attachmentsForEvent = eventId ? attachmentsByEventId.get(eventId) : undefined;

        if (!attachmentsForEvent?.length && eventCount === 1 && envelopeScopedAttachments.length > 0) {
          attachmentsForEvent = envelopeScopedAttachments;
        }

        if (attachmentsForEvent?.length) {
          item.attachments = attachmentsForEvent;
        }
        // The below is an async function but we really don't need to wait for that
        get().pushEvent(itemData as SentryEvent);
      }
    }

    const { envelopes } = get();
    const newEnvelopes = new Map(envelopes);
    newEnvelopes.set(header.__spotlight_envelope_id as string, envelope);
    set({ envelopes: newEnvelopes });
    return newEnvelopes.size;
  },
  getEnvelopeById: (id: string) => {
    return get().envelopes.get(id);
  },
  getEnvelopes: () => Array.from(get().envelopes.values()),
});
