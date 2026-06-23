import { ReactComponent as AlertCircle } from "@spotlight/ui/assets/alertCircle.svg";
import { ReactComponent as Hash } from "@spotlight/ui/assets/hash.svg";
import { useMemo } from "react";
import type { EventException, SentryErrorEvent } from "../types";
import type { FilterConfigs, FilterOption } from "./filterTypes";

const FILTER_TYPES = {
  LEVEL: "level",
  TYPE: "type",
} as const;

function exceptionValues(exception: EventException) {
  return exception.value ? [exception.value] : exception.values;
}

function getEventMessage(event: SentryErrorEvent): string {
  if (typeof event.message === "string") return event.message;
  if (event.message && typeof event.message.formatted === "string") return event.message.formatted;
  return "";
}

const createFilterOptions = (items: Set<string>): FilterOption[] =>
  Array.from(items).map(item => ({ label: item, value: item }));

const useErrorFiltering = (events: SentryErrorEvent[], activeFilters: string[], searchQuery: string) => {
  const { levelOptions, typeOptions } = useMemo(() => {
    const levels = new Set<string>();
    const types = new Set<string>();

    for (const event of events) {
      if (event.level) levels.add(event.level);
      for (const value of exceptionValues(event.exception)) {
        if (value.type) types.add(value.type);
      }
    }

    return {
      levelOptions: createFilterOptions(levels),
      typeOptions: createFilterOptions(types),
    };
  }, [events]);

  const ERROR_FILTER_CONFIGS: FilterConfigs = useMemo(
    () => ({
      [FILTER_TYPES.LEVEL]: {
        icon: AlertCircle,
        label: "Level",
        options: levelOptions,
        show: levelOptions.length > 0,
        type: "checkbox",
      },
      [FILTER_TYPES.TYPE]: {
        icon: Hash,
        label: "Exception Type",
        options: typeOptions,
        show: typeOptions.length > 0,
        type: "checkbox",
      },
    }),
    [levelOptions, typeOptions],
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const hasQuery = Boolean(normalizedQuery);
    const hasFilters = activeFilters.length > 0;

    if (!hasQuery && !hasFilters) return events;

    const levelValues = new Set(levelOptions.map(o => o.value));
    const typeValues = new Set(typeOptions.map(o => o.value));
    const activeLevels = activeFilters.filter(f => levelValues.has(f));
    const activeTypes = activeFilters.filter(f => typeValues.has(f));

    return events.filter(event => {
      if (activeLevels.length > 0 && (!event.level || !activeLevels.includes(event.level))) {
        return false;
      }

      const values = exceptionValues(event.exception);

      if (activeTypes.length > 0 && !values.some(v => activeTypes.includes(v.type))) {
        return false;
      }

      if (hasQuery) {
        const haystack = [getEventMessage(event), ...values.map(v => `${v.type} ${v.value}`)].join(" ").toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [events, activeFilters, searchQuery, levelOptions, typeOptions]);

  return {
    ERROR_FILTER_CONFIGS,
    filteredEvents,
  };
};

export default useErrorFiltering;
