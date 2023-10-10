import type { Integration } from "../integration";

export default function consoleIntegration() {
  return {
    name: "console",
    hooks: {
      "spotlight:integration:init": () => {},
    },
    forwardedContentType: ["application/x-spotlight-console"],
    tabs: [
      {
        name: "Console",
      },
    ],
  } as Integration;
}
