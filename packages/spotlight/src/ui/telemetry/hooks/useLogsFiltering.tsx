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

const createFilterOptions = (items: Set<string>): FilterOption[] =>
  Array.from(items).map(item => ({ label: item, value: item }));

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
      levelOptions: createFilterOptions(levels),
      loggerOptions: createFilterOptions(loggers),
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

    const levelValues = new Set(levelOptions.map(o => o.value));
    const loggerValues = new Set(loggerOptions.map(o => o.value));
    const activeLevels = activeFilters.filter(f => levelValues.has(f));
    const activeLoggers = activeFilters.filter(f => loggerValues.has(f));

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
  }, [logs, activeFilters, searchQuery, levelOptions, loggerOptions]);

  return {
    LOGS_FILTER_CONFIGS,
    filteredLogs,
  };
};

export default useLogsFiltering;
