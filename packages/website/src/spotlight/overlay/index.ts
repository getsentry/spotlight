import type { DevOverlayPlugin } from 'astro';
import sentrylogo from './sentry-logo.svg?raw';

import * as Spotlight from '@spotlightjs/core';

export default {
  id: 'spotlight-plugin',
  name: 'Sentry Spotlight',
  icon: sentrylogo,
  init(_canvas, eventTarget) {
    eventTarget.dispatchEvent(
      new CustomEvent('plugin-notification', {
        detail: {
          state: true,
        },
      }),
    );

    eventTarget.addEventListener('plugin-toggle', () => {
      Spotlight.toggleSpotlight();
    });
  },
} satisfies DevOverlayPlugin;
