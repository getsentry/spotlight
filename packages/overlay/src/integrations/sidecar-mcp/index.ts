import { parseStringFromBuffer } from "~/integrations/utils/bufferParsers";
import type { Integration } from "../integration";
import { createTab } from "../sentry/utils/tabs";
import SidecarMcpTab from "./SidecarMcpTab";
import { SIDECAR_MCP_CONTENT_TYPE } from "./constants";
import useSidecarMcpStore from "./store";
import type { SidecarMcpInteraction } from "./types";

export default function sidecarMcpIntegration(): Integration<SidecarMcpInteraction> {
  return {
    name: "sidecar-mcp",

    forwardedContentType: [SIDECAR_MCP_CONTENT_TYPE],

    setup: () => {},

    processEvent: eventContext => {
      if (eventContext.contentType === SIDECAR_MCP_CONTENT_TYPE) {
        try {
          let interactionData: string;

          if (eventContext.data instanceof Uint8Array) {
            interactionData = parseStringFromBuffer(eventContext.data) as string;
          } else {
            interactionData = eventContext.data as string;
          }

          const interaction = JSON.parse(interactionData) as SidecarMcpInteraction;

          useSidecarMcpStore.getState().addInteraction(interaction);

          return { event: interaction };
        } catch (error) {
          console.error("Failed to parse Sidecar MCP interaction:", error);
          return undefined;
        }
      }
      return undefined;
    },

    panels: () => {
      const store = useSidecarMcpStore.getState();
      const interactionCount = store.getInteractions().length;

      return [
        createTab("sidecar-mcp", "Sidecar MCP", {
          content: SidecarMcpTab,
          notificationCount: { count: interactionCount },
        }),
      ];
    },

    reset: () => {
      useSidecarMcpStore.getState().clearInteractions();
    },
  };
}
