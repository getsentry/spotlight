export interface Integration {
  name: string;
  hooks: {
    "spotlight:integration:init"?: () => void | Promise<void>;
  };
  forwardedContentType?: string[];
  tabs?: {
    name: string;
    count?: number;
  }[];
}

export type IntegrationParameter = Array<
  | Integration
  | (Integration | false | undefined | null)[]
  | false
  | undefined
  | null
>;

export async function initIntegrations(
  integrations?: IntegrationParameter
): Promise<Integration[]> {
  if (!integrations) {
    return [];
  }
  const initializedIntegrations: Integration[] = [];
  // iterate over integrations and call their hooks
  for (const integration of integrations) {
    if (Array.isArray(integration)) {
      initializedIntegrations.push(...(await initIntegrations(integration)));
    } else if (integration) {
      const hooks = integration.hooks;
      if (hooks) {
        const setupHook = hooks["spotlight:integration:init"];
        if (setupHook) {
          setupHook();
        }
      }
      initializedIntegrations.push(integration);
    }
  }

  return initializedIntegrations;
}
