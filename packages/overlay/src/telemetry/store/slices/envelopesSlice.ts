import type { Envelope } from "@sentry/core";
import type { StateCreator } from "zustand";
import { SUPPORTED_EVENT_TYPES } from "../../constants/sentry";
import type { Sdk, SentryEvent } from "../../types";
import { sdkToPlatform } from "../../utils/sdkToPlatform";
import type { EnvelopesSliceActions, EnvelopesSliceState, SentryStore } from "../types";
import { RAW_TYPES } from "@spotlightjs/sidecar/constants";

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

    // Collect all attachments from this envelope
    const attachments = items
      .filter(([itemHeader]) => RAW_TYPES.has(itemHeader.type))
      .map(([itemHeader, itemData]) => ({
        header: itemHeader,
        // @ts-expect-error -- attachment data structure has data property
        data: itemData.data as string,
      }));

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
        // Associate attachments with this event
        if (attachments.length > 0) {
          item.attachments = attachments;
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
