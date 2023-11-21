function serializeEnvelope(envelope) {
  const [envHeaders, items] = envelope;

  // Initially we construct our envelope as a string and only convert to binary chunks if we encounter binary data
  const parts = [];
  parts.push(JSON.stringify(envHeaders));

  for (const item of items) {
    const [itemHeaders, payload] = item;

    parts.push('\\n' + JSON.stringify(itemHeaders) + '\\n');

    parts.push(JSON.stringify(payload));
  }

  return parts.join('');
}
export function connect(hub) {
  // A very hacky way to hook into Sentry's SDK
  // but we love hacks
  hub._stack[0].client.setupIntegrations(true);
  hub._stack[0].client.on('beforeEnvelope', envelope => {
    fetch('http://localhost:8969/stream', {
      method: 'POST',
      body: serializeEnvelope(envelope),
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      mode: 'cors',
    }).catch(() => {
      console.warn('[Spotlight] Failed to send envelope to Spotlight Sidecar');
    });
  });
}
