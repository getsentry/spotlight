import { ReactComponent as AlertCircle } from "@spotlight/ui/assets/alertCircle.svg";
import { ReactComponent as Hash } from "@spotlight/ui/assets/hash.svg";
import { useMemo } from "react";
import type { SentryLogEventItem } from "../types";
import type { FilterConfigs, FilterOption } from "./filterTypes";

const FILTER_TYPES = {
  LEVEL: "level",
  LOGGER: "logger",
} as const;

function getLoggerName(log: SentryLogEventItem): string | undefined {
  return log.attributes?.["sentry.logger.name"]?.value as string | undefined;
}

// Filter values are namespaced by dimension (e.g. "level:error") so a value
// that exists in two dimensions doesn't get applied to both at once.
const createFilterOptions = (dimension: string, items: Set<string>): FilterOption[] =>
  Array.from(items).map(item => ({ label: item, value: `${dimension}:${item}` }));

const stripDimension = (value: string): string => value.slice(value.indexOf(":") + 1);

const useLogsFiltering = (logs: SentryLogEventItem[], activeFilters: string[], searchQuery: string) => {
  const { levelOptions, loggerOptions } = useMemo(() => {
    const levels = new Set<string>();
    const loggers = new Set<string>();

    for (const log of logs) {
      if (log.level) levels.add(log.level);
      const logger = getLoggerName(log);
      if (logger) loggers.add(logger);
    }

    return {
      levelOptions: createFilterOptions(FILTER_TYPES.LEVEL, levels),
      loggerOptions: createFilterOptions(FILTER_TYPES.LOGGER, loggers),
    };
  }, [logs]);

  const LOGS_FILTER_CONFIGS: FilterConfigs = useMemo(
    () => ({
      [FILTER_TYPES.LEVEL]: {
        icon: AlertCircle,
        label: "Severity",
        options: levelOptions,
        show: levelOptions.length > 0,
        type: "checkbox",
      },
      [FILTER_TYPES.LOGGER]: {
        icon: Hash,
        label: "Logger",
        options: loggerOptions,
        show: loggerOptions.length > 0,
        type: "checkbox",
      },
    }),
    [levelOptions, loggerOptions],
  );

  const filteredLogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const hasQuery = Boolean(normalizedQuery);
    const hasFilters = activeFilters.length > 0;

    if (!hasQuery && !hasFilters) return logs;

    const activeLevels = activeFilters.filter(f => f.startsWith(`${FILTER_TYPES.LEVEL}:`)).map(stripDimension);
    const activeLoggers = activeFilters.filter(f => f.startsWith(`${FILTER_TYPES.LOGGER}:`)).map(stripDimension);

    return logs.filter(log => {
      if (activeLevels.length > 0 && !activeLevels.includes(log.level)) {
        return false;
      }

      if (activeLoggers.length > 0) {
        const logger = getLoggerName(log);
        if (!logger || !activeLoggers.includes(logger)) return false;
      }

      if (hasQuery && !log.body.toLowerCase().includes(normalizedQuery)) {
        return false;
      }

      return true;
    });
  }, [logs, activeFilters, searchQuery]);

  return {
    LOGS_FILTER_CONFIGS,
    filteredLogs,
  };
};

export default useLogsFiltering;
