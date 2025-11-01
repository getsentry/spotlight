import type { TabPanel } from "~/types";

export function createTab<T>(
  id: string,
  title: string,
  extra: Partial<Omit<TabPanel<T>, "id" | "title">> = {},
): TabPanel<T> {
  return {
    id,
    title,
    ...extra,
  };
}
