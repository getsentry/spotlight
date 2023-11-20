const { setupSidecar } = await import('@spotlightjs/sidecar');

export default function spotlightSidecar() {
  return {
    name: 'spotlightjs-sidecar',

    configureServer() {
      setupSidecar();
    },
  };
}
