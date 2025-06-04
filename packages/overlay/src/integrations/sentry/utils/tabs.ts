import type { IntegrationPanel } from "~/integrations/integration";

export function createTab<T>(
  id: string,
  title: string,
  extra: Partial<Omit<IntegrationPanel<T>, "id" | "title">> = {},
): IntegrationPanel<T> {
  return {
    id,
    title,
    ...extra,
  };
}
