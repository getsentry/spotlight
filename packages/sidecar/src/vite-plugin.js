const { setupSidecar } = await import('@spotlightjs/sidecar');

export default function spotlightSidecar(port) {
  return {
    name: 'spotlightjs-sidecar',

    configureServer() {
      setupSidecar({ port });
    },
  };
}
