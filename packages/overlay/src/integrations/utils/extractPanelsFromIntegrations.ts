/**
 * util to extract all panels/tabs from integrations, with processedEvents.
 */
import type { Integration, IntegrationData } from "../../integrations/integration";

export function getPanelsFromIntegrations(integrations: Integration[], integrationData: IntegrationData<unknown>) {
  return integrations.flatMap(integration => {
    if (integration.panels || integration.tabs) {
      const processedEvents = integrationData[integration.name]?.map(container => container.event) || [];
      return (
        integration.panels?.({ processedEvents }) ||
        integration.tabs?.({ processedEvents }).map(tab => ({ ...tab, processedEvents })) ||
        []
      );
    }
    return [];
  });
}
