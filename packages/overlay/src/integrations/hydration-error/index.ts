import type { Integration } from '../integration';
import HydrationErrorDisplay from './HydrationErrorDisplay';

export default function hydrationErrorIntegration() {
  return {
    name: 'hydration-error',
    tabs: () => [
      {
        id: 'hydration-error',
        title: 'Hydration Error',
        content: HydrationErrorDisplay,
      },
    ],
  } satisfies Integration;
}
