export interface Integration {
  name: string;
  hooks: {
    "spotlight:integration:init"?: () => void | Promise<void>;
  };
}

export type IntegrationParameter = Array<
  | Integration
  | (Integration | false | undefined | null)[]
  | false
  | undefined
  | null
>;

export function initIntegrations(integrations?: IntegrationParameter) {
  if (!integrations) {
    return;
  }
  // iterate over integrations and call their hooks
  for (const integration of integrations) {
    if (Array.isArray(integration)) {
      initIntegrations(integration);
    } else if (integration) {
      const hooks = integration.hooks;
      if (hooks) {
        const setupHook = hooks["spotlight:integration:init"];
        if (setupHook) {
          setupHook();
        }
      }
    }
  }
}
