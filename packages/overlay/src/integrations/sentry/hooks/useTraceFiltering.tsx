import dayjs from 'dayjs';
import { ElementType, useCallback, useMemo } from 'react';
import { ReactComponent as AlertCircle } from '~/assets/alertCircle.svg';
import { ReactComponent as Branch } from '~/assets/branch.svg';
import { ReactComponent as Clock } from '~/assets/clock.svg';
import { ReactComponent as Filter } from '~/assets/filter.svg';
import { ReactComponent as Hash } from '~/assets/hash.svg';
import { Trace } from '../types';
import { getRootTransactionMethod, getRootTransactionName } from '../utils/traces';

const DURATION_THRESHOLDS = {
  FAST_RESPONSE_MAX: 100,
  SLOW_RESPONSE_MIN: 1000,
} as const;

const PERFORMANCE_FILTER_VALUES = {
  ZERO_SPANS: 'zero_spans',
  HAS_SPANS: 'has_spans',
  FAST_RESPONSE: 'fast_response',
  MEDIUM_RESPONSE: 'medium_response',
  SLOW_RESPONSE: 'slow_response',
} as const;

const PERFORMANCE_FILTER_SET = new Set(Object.values(PERFORMANCE_FILTER_VALUES));

const PERFORMANCE_FILTER_LABELS = {
  [PERFORMANCE_FILTER_VALUES.ZERO_SPANS]: 'No spans (0)',
  [PERFORMANCE_FILTER_VALUES.HAS_SPANS]: 'With spans (>0)',
  [PERFORMANCE_FILTER_VALUES.FAST_RESPONSE]: 'Fast (<100ms)',
  [PERFORMANCE_FILTER_VALUES.MEDIUM_RESPONSE]: 'Medium (100ms-1s)',
  [PERFORMANCE_FILTER_VALUES.SLOW_RESPONSE]: 'Slow (>1s)',
} as const;

const FILTER_TYPES = {
  TRANSACTION: 'transaction',
  METHOD: 'method',
  STATUS: 'status',
  TIME: 'time',
  PERFORMANCE: 'performance',
} as const;

const FILTER_CONFIG_METADATA = {
  [FILTER_TYPES.TRANSACTION]: {
    label: 'Transaction',
    tooltip: 'Filter by transaction type',
  },
  [FILTER_TYPES.METHOD]: {
    label: 'Method',
    tooltip: 'Filter by HTTP method',
  },
  [FILTER_TYPES.STATUS]: {
    label: 'Status',
    tooltip: 'Filter by response status',
  },
  [FILTER_TYPES.TIME]: {
    label: 'Time',
    tooltip: 'Filter by time period',
  },
  [FILTER_TYPES.PERFORMANCE]: {
    label: 'Performance',
    tooltip: 'Filter by performance metrics',
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
  timeOptions: FilterOption[];
  statusOptions: FilterOption[];
}

interface GroupedFilters {
  [FILTER_TYPES.TRANSACTION]: Set<string>;
  [FILTER_TYPES.METHOD]: Set<string>;
  [FILTER_TYPES.STATUS]: Set<string>;
  [FILTER_TYPES.TIME]: Set<string>;
  [FILTER_TYPES.PERFORMANCE]: Set<string>;
}

interface TraceProperties {
  transactionName: string;
  method: string | null;
  timeLabel: string;
  status: string;
  duration: number;
}

const createFilterOptionsFromSet = (items: Set<string>): FilterOption[] =>
  Array.from(items).map(item => ({ label: item, value: item }));

const PERFORMANCE_FILTER_OPTIONS: FilterOption[] = [
  {
    label: PERFORMANCE_FILTER_LABELS[PERFORMANCE_FILTER_VALUES.ZERO_SPANS],
    value: PERFORMANCE_FILTER_VALUES.ZERO_SPANS,
  },
  {
    label: PERFORMANCE_FILTER_LABELS[PERFORMANCE_FILTER_VALUES.HAS_SPANS],
    value: PERFORMANCE_FILTER_VALUES.HAS_SPANS,
  },
  {
    label: PERFORMANCE_FILTER_LABELS[PERFORMANCE_FILTER_VALUES.FAST_RESPONSE],
    value: PERFORMANCE_FILTER_VALUES.FAST_RESPONSE,
  },
  {
    label: PERFORMANCE_FILTER_LABELS[PERFORMANCE_FILTER_VALUES.MEDIUM_RESPONSE],
    value: PERFORMANCE_FILTER_VALUES.MEDIUM_RESPONSE,
  },
  {
    label: PERFORMANCE_FILTER_LABELS[PERFORMANCE_FILTER_VALUES.SLOW_RESPONSE],
    value: PERFORMANCE_FILTER_VALUES.SLOW_RESPONSE,
  },
];

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
  const timeValues = new Set(availableOptions.timeOptions.map(opt => opt.value));

  for (const filter of activeFilters) {
    if (transactionValues.has(filter)) {
      grouped[FILTER_TYPES.TRANSACTION].add(filter);
    } else if (methodValues.has(filter)) {
      grouped[FILTER_TYPES.METHOD].add(filter);
    } else if (statusValues.has(filter)) {
      grouped[FILTER_TYPES.STATUS].add(filter);
    } else if (timeValues.has(filter)) {
      grouped[FILTER_TYPES.TIME].add(filter);
    } else if (PERFORMANCE_FILTER_SET.has(filter as typeof PERFORMANCE_FILTER_SET extends Set<infer T> ? T : never)) {
      grouped[FILTER_TYPES.PERFORMANCE].add(filter);
    }
  }

  return grouped;
};

const matchesPerformanceFilter = (trace: Trace, duration: number, filterValue: string): boolean => {
  switch (filterValue) {
    case PERFORMANCE_FILTER_VALUES.ZERO_SPANS:
      return trace.spans.size === 0;
    case PERFORMANCE_FILTER_VALUES.HAS_SPANS:
      return trace.spans.size > 0;
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

const matchesFilterGroup = (
  trace: Trace,
  traceProps: TraceProperties,
  filterType: string,
  filterValues: Set<string>,
): boolean => {
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
        if (traceProps.timeLabel === filterValue) return true;
        break;
      case FILTER_TYPES.PERFORMANCE:
        if (matchesPerformanceFilter(trace, traceProps.duration, filterValue)) return true;
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
        timeOptions: [],
        statusOptions: [],
      };
    }

    const uniqueTransactionNames = new Set<string>();
    const uniqueMethodNames = new Set<string>();
    const uniqueTimeLabels = new Set<string>();
    const uniqueStatusLabels = new Set<string>();

    for (const trace of visibleTraces) {
      const transactionName = getRootTransactionName(trace);
      if (transactionName) uniqueTransactionNames.add(transactionName);

      const method = getRootTransactionMethod(trace);
      if (method) uniqueMethodNames.add(method);

      const timeLabel = dayjs(trace.start_timestamp).fromNow();
      if (timeLabel) uniqueTimeLabels.add(timeLabel);

      const status = trace.status;
      if (status) uniqueStatusLabels.add(status);
    }

    return {
      transactionOptions: createFilterOptionsFromSet(uniqueTransactionNames),
      methodOptions: createFilterOptionsFromSet(uniqueMethodNames),
      timeOptions: createFilterOptionsFromSet(uniqueTimeLabels),
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
      },
      [FILTER_TYPES.METHOD]: {
        icon: FILTER_ICONS[FILTER_TYPES.METHOD],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.METHOD].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.METHOD].tooltip,
        options: filterConfigData.methodOptions,
        show: filterConfigData.methodOptions.length > 0,
      },
      [FILTER_TYPES.STATUS]: {
        icon: FILTER_ICONS[FILTER_TYPES.STATUS],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.STATUS].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.STATUS].tooltip,
        options: filterConfigData.statusOptions,
        show: filterConfigData.statusOptions.length > 0,
      },
      [FILTER_TYPES.TIME]: {
        icon: FILTER_ICONS[FILTER_TYPES.TIME],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.TIME].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.TIME].tooltip,
        options: filterConfigData.timeOptions,
        show: filterConfigData.timeOptions.length > 0,
      },
      [FILTER_TYPES.PERFORMANCE]: {
        icon: FILTER_ICONS[FILTER_TYPES.PERFORMANCE],
        label: FILTER_CONFIG_METADATA[FILTER_TYPES.PERFORMANCE].label,
        tooltip: FILTER_CONFIG_METADATA[FILTER_TYPES.PERFORMANCE].tooltip,
        options: PERFORMANCE_FILTER_OPTIONS,
        show: true,
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
        timeLabel: dayjs(trace.start_timestamp).fromNow(),
        status: trace.status || '',
        duration: trace.timestamp - trace.start_timestamp || 0,
      };

      return (
        matchesFilterGroup(
          trace,
          traceProperties,
          FILTER_TYPES.TRANSACTION,
          groupedFilters[FILTER_TYPES.TRANSACTION],
        ) &&
        matchesFilterGroup(trace, traceProperties, FILTER_TYPES.METHOD, groupedFilters[FILTER_TYPES.METHOD]) &&
        matchesFilterGroup(trace, traceProperties, FILTER_TYPES.STATUS, groupedFilters[FILTER_TYPES.STATUS]) &&
        matchesFilterGroup(trace, traceProperties, FILTER_TYPES.TIME, groupedFilters[FILTER_TYPES.TIME]) &&
        matchesFilterGroup(trace, traceProperties, FILTER_TYPES.PERFORMANCE, groupedFilters[FILTER_TYPES.PERFORMANCE])
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
