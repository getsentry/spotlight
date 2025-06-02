import { type ElementType, useCallback, useMemo } from "react";
import { ReactComponent as AlertCircle } from "~/assets/alertCircle.svg";
import { ReactComponent as Branch } from "~/assets/branch.svg";
import { ReactComponent as Clock } from "~/assets/clock.svg";
import { ReactComponent as Filter } from "~/assets/filter.svg";
import { ReactComponent as Hash } from "~/assets/hash.svg";
import type { Trace } from "../types";
import { getRootTransactionMethod, getRootTransactionName } from "../utils/traces";

interface TraceProperties {
  transactionName: string;
  method: string | null;
  startTimestamp: number;
  status: string;
  duration: number;
  spansSize: number;
}

const DURATION_THRESHOLDS = {
  FAST_RESPONSE_MAX: 100,
  SLOW_RESPONSE_MIN: 1000,
} as const;

const PERFORMANCE_FILTER_VALUES = {
  ZERO_SPANS: "No spans (0)",
  HAS_SPANS: "With spans (>0)",
  FAST_RESPONSE: "Fast (<100ms)",
  MEDIUM_RESPONSE: "Medium (100ms-1s)",
  SLOW_RESPONSE: "Slow (>1s)",
} as const;

const PERFORMANCE_FILTER_OPTIONS: FilterOption[] = Object.entries(PERFORMANCE_FILTER_VALUES).map(([, label]) => ({
  label,
  value: label,
}));

const PERFORMANCE_FILTER_SET = new Set(Object.values(PERFORMANCE_FILTER_VALUES));

const TIME_FILTER_VALUES = {
  LAST_MINUTE: "Last minute",
  LAST_5_MINUTES: "Last 5 minutes",
  LAST_15_MINUTES: "Last 15 minutes",
  LAST_30_MINUTES: "Last 30 minutes",
  LAST_1_HOUR: "Last 1 hour",
  LAST_4_HOURS: "Last 4 hours",
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  LAST_24_HOURS: "Last 24 hours",
  LAST_7_DAYS: "Last 7 days",
  BEYOND_7_DAYS: "Older than 7 days",
} as const;

const TIME_FILTER_OPTIONS = Object.entries(TIME_FILTER_VALUES).map(([, label]) => ({
  value: label,
  label,
}));

const TIME_FILTER_SET = new Set(Object.values(TIME_FILTER_VALUES));

const FILTER_TYPES = {
  TRANSACTION: "transaction",
  METHOD: "method",
  STATUS: "status",
  TIME: "time",
  PERFORMANCE: "performance",
} as const;

const FILTER_CONFIG_METADATA = {
  [FILTER_TYPES.TRANSACTION]: {
    label: "Transaction",
    tooltip: "Filter by transaction type",
  },
  [FILTER_TYPES.METHOD]: {
    label: "Method",
    tooltip: "Filter by HTTP method",
  },
  [FILTER_TYPES.STATUS]: {
    label: "Status",
    tooltip: "Filter by response status",
  },
  [FILTER_TYPES.TIME]: {
    label: "Time",
    tooltip: "Filter by time period",
  },
  [FILTER_TYPES.PERFORMANCE]: {
    label: "Performance",
    tooltip: "Filter by performance metrics",
  },
} as const;

const FILTER_ICONS = {
  [FILTER_TYPES.TRANSACTION]: Filter,
  [FILTER_TYPES.METHOD]: Hash,
  [FILTER_TYPES.STATUS]: AlertCircle,
  [FILTER_TYPES.TIME]: Clock,
  [FILTER_TYPES.PERFORMANCE]: Branch,
} as const;

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  icon: ElementType;
  label: string;
  tooltip: string;
  options: FilterOption[];
  show: boolean;
  type: "checkbox" | "radio";
}

export interface FilterConfigs {
  [FILTER_TYPES.TRANSACTION]: FilterConfig;
  [FILTER_TYPES.METHOD]: FilterConfig;
  [FILTER_TYPES.STATUS]: FilterConfig;
  [FILTER_TYPES.TIME]: FilterConfig;
  [FILTER_TYPES.PERFORMANCE]: FilterConfig;
}

interface FilterConfigData {
  transactionOptions: FilterOption[];
  methodOptions: FilterOption[];
  statusOptions: FilterOption[];
}

interface GroupedFilters {
  [FILTER_TYPES.TRANSACTION]: Set<string>;
  [FILTER_TYPES.METHOD]: Set<string>;
  [FILTER_TYPES.STATUS]: Set<string>;
  [FILTER_TYPES.TIME]: Set<string>;
  [FILTER_TYPES.PERFORMANCE]: Set<string>;
}

const createFilterOptionsFromSet = (items: Set<string>): FilterOption[] =>
  Array.from(items).map(item => ({ label: item, value: item }));

const groupFiltersByType = (activeFilters: string[], availableOptions: FilterConfigData): GroupedFilters => {
  const grouped: GroupedFilters = {
    [FILTER_TYPES.TRANSACTION]: new Set(),
    [FILTER_TYPES.METHOD]: new Set(),
    [FILTER_TYPES.STATUS]: new Set(),
    [FILTER_TYPES.TIME]: new Set(),
    [FILTER_TYPES.PERFORMANCE]: new Set(),
  };

  const transactionValues = new Set(availableOptions.transactionOptions.map(opt => opt.value));
  const methodValues = new Set(availableOptions.methodOptions.map(opt => opt.value));
  const statusValues = new Set(availableOptions.statusOptions.map(opt => opt.value));

  for (const filter of activeFilters) {
    if (transactionValues.has(filter)) {
      grouped[FILTER_TYPES.TRANSACTION].add(filter);
    } else if (methodValues.has(filter)) {
      grouped[FILTER_TYPES.METHOD].add(filter);
    } else if (statusValues.has(filter)) {
      grouped[FILTER_TYPES.STATUS].add(filter);
    } else if (TIME_FILTER_SET.has(filter as typeof TIME_FILTER_SET extends Set<infer T> ? T : never)) {
      grouped[FILTER_TYPES.TIME].add(filter);
    } else if (PERFORMANCE_FILTER_SET.has(filter as typeof PERFORMANCE_FILTER_SET extends Set<infer T> ? T : never)) {
      grouped[FILTER_TYPES.PERFORMANCE].add(filter);
    }
  }

  return grouped;
};

const matchesPerformanceFilter = (traceProperties: TraceProperties, filterValue: string): boolean => {
  const { spansSize, duration } = traceProperties;
  switch (filterValue) {
    case PERFORMANCE_FILTER_VALUES.ZERO_SPANS:
      return spansSize === 0;
    case PERFORMANCE_FILTER_VALUES.HAS_SPANS:
      return spansSize > 0;
    case PERFORMANCE_FILTER_VALUES.FAST_RESPONSE:
      return duration < DURATION_THRESHOLDS.FAST_RESPONSE_MAX;
    case PERFORMANCE_FILTER_VALUES.MEDIUM_RESPONSE:
      return duration >= DURATION_THRESHOLDS.FAST_RESPONSE_MAX && duration <= DURATION_THRESHOLDS.SLOW_RESPONSE_MIN;
    case PERFORMANCE_FILTER_VALUES.SLOW_RESPONSE:
      return duration > DURATION_THRESHOLDS.SLOW_RESPONSE_MIN;
    default:
      return false;
  }
};

const matchesTimeFilter = (traceProperties: TraceProperties, filterValue: string): boolean => {
  const { startTimestamp } = traceProperties;
  const now = Date.now();

  switch (filterValue) {
    case TIME_FILTER_VALUES.LAST_MINUTE:
      return startTimestamp >= now - 60 * 1000;
    case TIME_FILTER_VALUES.LAST_5_MINUTES:
      return startTimestamp >= now - 5 * 60 * 1000;
    case TIME_FILTER_VALUES.LAST_15_MINUTES:
      return startTimestamp >= now - 15 * 60 * 1000;
    case TIME_FILTER_VALUES.LAST_30_MINUTES:
      return startTimestamp >= now - 30 * 60 * 1000;
    case TIME_FILTER_VALUES.LAST_1_HOUR:
      return startTimestamp >= now - 60 * 60 * 1000;
    case TIME_FILTER_VALUES.LAST_4_HOURS:
      return startTimestamp >= now - 4 * 60 * 60 * 1000;
    case TIME_FILTER_VALUES.TODAY: {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return startTimestamp >= startOfToday.getTime();
    }
    case TIME_FILTER_VALUES.YESTERDAY: {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfYesterday = new Date(today);
      startOfYesterday.setDate(today.getDate() - 1);
      return startTimestamp >= startOfYesterday.getTime() && startTimestamp < today.getTime();
    }
    case TIME_FILTER_VALUES.LAST_24_HOURS:
      return startTimestamp >= now - 24 * 60 * 60 * 1000;
    case TIME_FILTER_VALUES.LAST_7_DAYS:
      return startTimestamp >= now - 7 * 24 * 60 * 60 * 1000;
    case TIME_FILTER_VALUES.BEYOND_7_DAYS:
      return startTimestamp < now - 7 * 24 * 60 * 60 * 1000;
    default:
      return false;
  }
};

const matchesFilterGroup = (traceProps: TraceProperties, filterType: string, filterValues: Set<string>): boolean => {
  if (filterValues.size === 0) return true;

  for (const filterValue of filterValues) {
    switch (filterType) {
      case FILTER_TYPES.TRANSACTION:
        if (traceProps.transactionName === filterValue) return true;
        break;
      case FILTER_TYPES.METHOD:
        if (traceProps.method === filterValue) return true;
        break;
      case FILTER_TYPES.STATUS:
        if (traceProps.status === filterValue) return true;
        break;
      case FILTER_TYPES.TIME:
        if (matchesTimeFilter(traceProps, filterValue)) return true;
        break;
      case FILTER_TYPES.PERFORMANCE:
        if (matchesPerformanceFilter(traceProps, filterValue)) return true;
        break;
    }
  }

  return false;
};

const useTraceFiltering = (visibleTraces: Trace[], activeFilters: string[], searchQuery: string) => {
  const filterConfigData = useMemo((): FilterConfigData => {
    if (!visibleTraces.length) {
      return {
        transactionOptions: [],
        methodOptions: [],
        statusOptions: [],
      };
    }

    const uniqueTransactionNames = new Set<string>();
    const uniqueMethodNames = new Set<string>();
    const uniqueStatusLabels = new Set<string>();

    for (const trace of visibleTraces) {
      const transactionName = getRootTransactionName(trace);
      if (transactionName) uniqueTransactionNames.add(transactionName);

      const method = getRootTransactionMethod(trace);
      if (method) uniqueMethodNames.add(method);

      const status = trace.status;
      if (status) uniqueStatusLabels.add(status);
    }

    return {
      transactionOptions: createFilterOptionsFromSet(uniqueTransactionNames),
      methodOptions: createFilterOptionsFromSet(uniqueMethodNames),
      statusOptions: createFilterOptionsFromSet(uniqueStatusLabels),
    };
  }, [visibleTraces]);

  const TRACE_FILTER_CONFIGS: FilterConfigs = useMemo(
    () => ({
      [FILTER_TYPES.TRANSACTION]: {
        icon: FILTER_ICONS[FILTER_TYPES.TRANSACTION],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.TRANSACTION].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.TRANSACTION].tooltip,
        options: filterConfigData.transactionOptions,
        show: filterConfigData.transactionOptions.length > 0,
        type: "checkbox",
      },
      [FILTER_TYPES.METHOD]: {
        icon: FILTER_ICONS[FILTER_TYPES.METHOD],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.METHOD].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.METHOD].tooltip,
        options: filterConfigData.methodOptions,
        show: filterConfigData.methodOptions.length > 0,
        type: "checkbox",
      },
      [FILTER_TYPES.STATUS]: {
        icon: FILTER_ICONS[FILTER_TYPES.STATUS],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.STATUS].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.STATUS].tooltip,
        options: filterConfigData.statusOptions,
        show: filterConfigData.statusOptions.length > 0,
        type: "checkbox",
      },
      [FILTER_TYPES.TIME]: {
        icon: FILTER_ICONS[FILTER_TYPES.TIME],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.TIME].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.TIME].tooltip,
        options: TIME_FILTER_OPTIONS,
        show: true,
        type: "radio",
      },
      [FILTER_TYPES.PERFORMANCE]: {
        icon: FILTER_ICONS[FILTER_TYPES.PERFORMANCE],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.PERFORMANCE].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.PERFORMANCE].tooltip,
        options: PERFORMANCE_FILTER_OPTIONS,
        show: true,
        type: "checkbox",
      },
    }),
    [filterConfigData],
  );

  const applyTraceFilters = useCallback(() => {
    if (!visibleTraces.length) {
      return [];
    }

    const normalizedSearchQuery = searchQuery?.toLowerCase();
    const hasSearchCriteria = Boolean(normalizedSearchQuery);
    const hasActiveFilters = activeFilters.length > 0;

    if (!hasSearchCriteria && !hasActiveFilters) {
      return visibleTraces;
    }
    const groupedFilters = hasActiveFilters ? groupFiltersByType(activeFilters, filterConfigData) : null;

    const filteredTraces = visibleTraces.filter(trace => {
      if (hasSearchCriteria) {
        const transactionName = getRootTransactionName(trace);
        const matchesSearchQuery =
          transactionName.toLowerCase().includes(normalizedSearchQuery) ||
          trace.trace_id.toLowerCase().includes(normalizedSearchQuery);

        if (!matchesSearchQuery) return false;
      }

      if (!hasActiveFilters || !groupedFilters) return true;

      const traceProperties: TraceProperties = {
        transactionName: getRootTransactionName(trace),
        method: getRootTransactionMethod(trace),
        startTimestamp: trace.start_timestamp,
        status: trace.status || "",
        spansSize: trace?.spans?.size || 0,
        duration: trace.timestamp - trace.start_timestamp || 0,
      };

      return (
        matchesFilterGroup(traceProperties, FILTER_TYPES.TRANSACTION, groupedFilters[FILTER_TYPES.TRANSACTION]) &&
        matchesFilterGroup(traceProperties, FILTER_TYPES.METHOD, groupedFilters[FILTER_TYPES.METHOD]) &&
        matchesFilterGroup(traceProperties, FILTER_TYPES.STATUS, groupedFilters[FILTER_TYPES.STATUS]) &&
        matchesFilterGroup(traceProperties, FILTER_TYPES.TIME, groupedFilters[FILTER_TYPES.TIME]) &&
        matchesFilterGroup(traceProperties, FILTER_TYPES.PERFORMANCE, groupedFilters[FILTER_TYPES.PERFORMANCE])
      );
    });

    return filteredTraces;
  }, [visibleTraces, activeFilters, searchQuery, filterConfigData]);

  return {
    TRACE_FILTER_CONFIGS,
    filteredTraces: applyTraceFilters() || [],
  };
};

export default useTraceFiltering;
