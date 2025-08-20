import type { Envelope } from "@sentry/core";
import { generateUuidv4 } from "@spotlightjs/core";
import type { RawEventContext } from "@spotlightjs/core/sentry";
import { SUPPORTED_EVENT_TYPES, type Sdk, type SentryEvent, sdkToPlatform } from "@spotlightjs/core/sentry";
import type { StateCreator } from "zustand";
import type { EnvelopesSliceActions, EnvelopesSliceState, SentryStore } from "../types";

const initialEnvelopesState: EnvelopesSliceState = {
  envelopes: new Map(),
};

export const createEnvelopesSlice: StateCreator<SentryStore, [], [], EnvelopesSliceState & EnvelopesSliceActions> = (
  set,
  get,
) => ({
  ...initialEnvelopesState,
  pushEnvelope: ({ envelope, rawEnvelope }: { envelope: Envelope; rawEnvelope: RawEventContext }) => {
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

    const envelopeId = generateUuidv4();
    header.__spotlight_envelope_id = envelopeId;

    const traceContext = header.trace;

    for (const [itemHeader, itemData] of items) {
      if (SUPPORTED_EVENT_TYPES.has(itemHeader.type)) {
        const item = itemData as SentryEvent;
        item.platform = sdkToPlatform(sdk.name);
        if (traceContext) {
          if (!item.contexts) {
            item.contexts = {};
          }
          item.contexts.trace ??= traceContext;
        }
        // The below is an async function but we really don't need to wait for that
        get().pushEvent(itemData as SentryEvent);
      }
    }

    const { envelopes } = get();
    const newEnvelopes = new Map(envelopes);
    newEnvelopes.set(envelopeId, { envelope, rawEnvelope });
    set({ envelopes: newEnvelopes });
    return newEnvelopes.size;
  },
  getEnvelopeById: (id: string) => {
    return get().envelopes.get(id);
  },
  getEnvelopes: () => Array.from(get().envelopes.values()),
});
