import type { Integration } from '../integration';
import ViteInspect from './vite-inspect';

export default function consoleIntegration() {
  return {
    name: 'vite-inspect',
    tabs: () => [
      {
        id: 'vite-inspect',
        title: 'Vite Inspect',
        content: ViteInspect,
      },
    ],

    setup: () => {},
  } satisfies Integration;
}
