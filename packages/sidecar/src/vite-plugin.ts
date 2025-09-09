import { setupSidecar } from "./main.js";

export default function spotlightSidecar(port?: number | string) {
  return {
    name: "spotlightjs-sidecar",

    configureServer() {
      setupSidecar({ port });
    },
  };
}
