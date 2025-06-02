import type { IntegrationTab } from '~/integrations/integration';

export function createTab<T>(
  id: string,
  title: string,
  extra: Partial<Omit<IntegrationTab<T>, 'id' | 'title'>> = {},
): IntegrationTab<T> {
  return {
    id,
    title,
    ...extra,
  };
}
