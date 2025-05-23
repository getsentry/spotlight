import type { AILibraryHandler } from '~/integrations/sentry/types';
import { vercelAISDKHandler } from './vercelAISDK';
// Registry of supported AI libraries
const aiLibraries: AILibraryHandler[] = [vercelAISDKHandler];

export { aiLibraries };
