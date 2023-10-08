import type { Integration } from "../integration";

export default function consoleIntegration() {
  return {
    name: "console",
    hooks: {
      "spotlight:integration:init": () => {},
    },
    tabs: [
      {
        name: "Console",
      },
    ],
  } as Integration;
}
