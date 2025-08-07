import type { NanovisTreeNode } from "./types";

export const DB_SPAN_REGEX = /^db(?:\.[A-Za-z]+)*$/;

export const AGGREGATE_CALL_PROFILES_SORT_KEYS = {
  functionName: "FUNCTION_NAME",
  totalTime: "TOTAL_TIME",
  samples: "SAMPLES",
  traces: "TRACES",
};

export const AGGREGATE_PROFILES_HEADERS = [
  {
    id: "name",
    title: "Function Name",
    sortKey: AGGREGATE_CALL_PROFILES_SORT_KEYS.functionName,
    primary: true,
  },
  {
    id: "totalTime",
    title: "Total Time",
    sortKey: AGGREGATE_CALL_PROFILES_SORT_KEYS.totalTime,
  },
  {
    id: "samples",
    title: "Samples",
    sortKey: AGGREGATE_CALL_PROFILES_SORT_KEYS.samples,
  },
  {
    id: "traces",
    title: "Traces",
    sortKey: AGGREGATE_CALL_PROFILES_SORT_KEYS.traces,
  },
];

export const AI_TRACES_SORT_KEYS = {
  traceId: "TRACE_ID",
  name: "NAME",
  operation: "OPERATION",
  timestamp: "TIMESTAMP",
  duration: "DURATION",
  tokens: "TOKENS",
};

export const AI_TRACES_HEADERS = [
  {
    id: "traceId",
    title: "Trace ID",
    sortKey: AI_TRACES_SORT_KEYS.traceId,
    primary: true,
  },
  {
    id: "name",
    title: "Name",
    sortKey: AI_TRACES_SORT_KEYS.name,
  },
  {
    id: "operation",
    title: "Operation",
    sortKey: AI_TRACES_SORT_KEYS.operation,
  },
  {
    id: "timestamp",
    title: "Timestamp",
    sortKey: AI_TRACES_SORT_KEYS.timestamp,
  },
  {
    id: "duration",
    title: "Duration",
    sortKey: AI_TRACES_SORT_KEYS.duration,
  },
  {
    id: "tokens",
    title: "Tokens (Prompt/Completion)",
    sortKey: AI_TRACES_SORT_KEYS.tokens,
  },
];

export const RESOURCES_SORT_KEYS = {
  avgDuration: "AVG_DURATION",
  totalTime: "TOTAL_TIME",
  description: "DESC",
  avgEncodedSize: "AVG_ENCODED_SIZE",
};

export const RESOURCE_HEADERS = [
  {
    id: "description",
    title: "Resource Description",
    sortKey: RESOURCES_SORT_KEYS.description,
    primary: true,
  },
  {
    id: "avgDuration",
    title: "Avg Duration",
    sortKey: RESOURCES_SORT_KEYS.avgDuration,
  },
  {
    id: "totalTime",
    title: "Total Time",
    sortKey: RESOURCES_SORT_KEYS.totalTime,
  },
  {
    id: "avgEncodedSize",
    title: "Avg Encoded Size",
    sortKey: RESOURCES_SORT_KEYS.avgEncodedSize,
  },
];

export const QUERIES_SORT_KEYS = {
  queryDesc: "QUERY_DESCRIPTION",
  totalTime: "TOTAL_TIME",
  avgDuration: "AVG_DURATION",
};

export const QUERIES_HEADERS = [
  {
    id: "queryDesc",
    title: "Query Description",
    sortKey: QUERIES_SORT_KEYS.queryDesc,
    primary: true,
  },
  {
    id: "totalTime",
    title: "Total Time",
    sortKey: QUERIES_SORT_KEYS.totalTime,
  },
  {
    id: "avgDuration",
    title: "Avg Duration",
    sortKey: QUERIES_SORT_KEYS.avgDuration,
  },
];

export const TRANSACTIONS_SORT_KEYS = {
  count: "count",
  lastSeen: "lastSeen",
};

export const TRANSACTIONS_TABLE_HEADERS = [
  {
    id: "transaction",
    title: "Transaction",
    primary: true,
  },
  {
    id: "lastSeen",
    title: "Last Seen",
    sortKey: TRANSACTIONS_SORT_KEYS.lastSeen,
  },
  {
    id: "count",
    title: "Count",
    sortKey: TRANSACTIONS_SORT_KEYS.count,
  },
];

export const TRANSACTION_SUMMARY_SORT_KEYS = {
  timestamp: "timestamp",
  duration: "duration",
};

export const TRANSACTION_SUMMARY_TABLE_HEADERS = [
  {
    id: "eventId",
    title: "Event Id",
    primary: true,
  },
  {
    id: "toalDuration",
    title: "Total Duration",
    sortKey: TRANSACTION_SUMMARY_SORT_KEYS.duration,
  },
  {
    id: "timestamp",
    title: "Timestamp",
    sortKey: TRANSACTION_SUMMARY_SORT_KEYS.timestamp,
  },
  {
    id: "traceId",
    title: "Trace Id",
  },
];
export const QUERY_SUMMARY_SORT_KEYS = {
  foundIn: "FOUND_IN",
  spanId: "SPAN_ID",
  totalTime: "TOTAL_TIME",
};

export const QUERY_SUMMARY_HEADERS = [
  {
    id: "foundIn",
    title: "Found In",
    sortKey: QUERY_SUMMARY_SORT_KEYS.foundIn,
    primary: true,
  },
  {
    id: "totalTime",
    title: "Total Time",
    sortKey: QUERY_SUMMARY_SORT_KEYS.totalTime,
  },
  {
    id: "spanId",
    title: "Span Id",
    sortKey: QUERY_SUMMARY_SORT_KEYS.spanId,
  },
];

export const WEB_VITALS_SORT_KEYS = {
  pages: "Pages",
  lcp: "LCP",
  fcp: "FCP",
  fid: "FID",
  cls: "CLS",
  ttfb: "TTFB",
  score: "PERFORMANCE_TOTAL_SCORE",
};

export const WEB_VITALS_HEADERS = [
  {
    id: "pages",
    title: "Pages",
    sortKey: WEB_VITALS_SORT_KEYS.pages,
    primary: true,
  },
  {
    id: "lcp",
    title: "LCP",
    sortKey: WEB_VITALS_SORT_KEYS.lcp,
  },
  {
    id: "fcp",
    title: "FCP",
    sortKey: WEB_VITALS_SORT_KEYS.fcp,
  },
  {
    id: "fid",
    title: "FID",
    sortKey: WEB_VITALS_SORT_KEYS.fid,
  },
  {
    id: "cls",
    title: "CLS",
    sortKey: WEB_VITALS_SORT_KEYS.cls,
  },
  {
    id: "ttfb",
    title: "TTFB",
    sortKey: WEB_VITALS_SORT_KEYS.ttfb,
  },
  {
    id: "score",
    title: "Perf Score",
    sortKey: WEB_VITALS_SORT_KEYS.score,
  },
];

export type WebVitals = "lcp" | "fcp" | "cls" | "ttfb" | "fid";

export const PERFORMANCE_SCORE_PROFILES = {
  profiles: [
    {
      name: "Chrome",
      scoreComponents: [
        { measurement: "fcp", weight: 0.15, p10: 900.0, p50: 1600.0, optional: false },
        { measurement: "lcp", weight: 0.3, p10: 1200.0, p50: 2400.0, optional: false },
        { measurement: "fid", weight: 0.3, p10: 100.0, p50: 300.0, optional: true },
        { measurement: "cls", weight: 0.15, p10: 0.1, p50: 0.25, optional: false },
        { measurement: "ttfb", weight: 0.1, p10: 200.0, p50: 400.0, optional: false },
      ],
      condition: { op: "eq", name: "event.contexts.browser.name", value: "Chrome" },
    },
    // TODO: Currently not getting browser data in events, so made these comments and sticked to chrome always.
    // {
    //   "name": "Firefox",
    //   "scoreComponents": [
    //     {"measurement": "fcp", "weight": 0.15, "p10": 900.0, "p50": 1600.0, "optional": false},
    //     {"measurement": "lcp", "weight": 0.0, "p10": 1200.0, "p50": 2400.0, "optional": false},
    //     {"measurement": "fid", "weight": 0.30, "p10": 100.0, "p50": 300.0, "optional": true},
    //     {"measurement": "cls", "weight": 0.0, "p10": 0.1, "p50": 0.25, "optional": false},
    //     {"measurement": "ttfb", "weight": 0.10, "p10": 200.0, "p50": 400.0, "optional": false}
    //   ],
    //   "condition": {"op": "eq", "name": "event.contexts.browser.name", "value": "Firefox"}
    // },
    // {
    //   "name": "Safari",
    //   "scoreComponents": [
    //     {"measurement": "fcp", "weight": 0.15, "p10": 900.0, "p50": 1600.0, "optional": false},
    //     {"measurement": "lcp", "weight": 0.0, "p10": 1200.0, "p50": 2400.0, "optional": false},
    //     {"measurement": "fid", "weight": 0.0, "p10": 100.0, "p50": 300.0, "optional": true},
    //     {"measurement": "cls", "weight": 0.0, "p10": 0.1, "p50": 0.25, "optional": false},
    //     {"measurement": "ttfb", "weight": 0.10, "p10": 200.0, "p50": 400.0, "optional": false}
    //   ],
    //   "condition": {"op": "eq", "name": "event.contexts.browser.name", "value": "Safari"}
    // },
    // {
    //   "name": "Edge",
    //   "scoreComponents": [
    //     {"measurement": "fcp", "weight": 0.15, "p10": 900.0, "p50": 1600.0, "optional": false},
    //     {"measurement": "lcp", "weight": 0.30, "p10": 1200.0, "p50": 2400.0, "optional": false},
    //     {"measurement": "fid", "weight": 0.30, "p10": 100.0, "p50": 300.0, "optional": true},
    //     {"measurement": "cls", "weight": 0.15, "p10": 0.1, "p50": 0.25, "optional": false},
    //     {"measurement": "ttfb", "weight": 0.10, "p10": 200.0, "p50": 400.0, "optional": false}
    //   ],
    //   "condition": {"op": "eq", "name": "event.contexts.browser.name", "value": "Edge"}
    // },
    // {
    //   "name": "Opera",
    //   "scoreComponents": [
    //     {"measurement": "fcp", "weight": 0.15, "p10": 900.0, "p50": 1600.0, "optional": false},
    //     {"measurement": "lcp", "weight": 0.30, "p10": 1200.0, "p50": 2400.0, "optional": false},
    //     {"measurement": "fid", "weight": 0.30, "p10": 100.0, "p50": 300.0, "optional": true},
    //     {"measurement": "cls", "weight": 0.15, "p10": 0.1, "p50": 0.25, "optional": false},
    //     {"measurement": "ttfb", "weight": 0.10, "p10": 200.0, "p50": 400.0, "optional": false}
    //   ],
    //   "condition": {"op": "eq", "name": "event.contexts.browser.name", "value": "Opera"}
    // }
  ],
};

export const LOG_LEVEL_COLORS: Record<string, string> = {
  trace: "text-gray-500",
  debug: "text-blue-500",
  info: "text-green-500",
  warn: "text-yellow-500",
  error: "text-red-500",
  fatal: "text-purple-500",
};

export const LOGS_SORT_KEYS = {
  timestamp: "TIMESTAMP",
  level: "LEVEL",
  sdk: "SDK",
};

export const LOGS_HEADERS = [
  {
    id: "level",
    title: "Level",
    sortKey: LOGS_SORT_KEYS.level,
    stretch: true,
  },
  {
    id: "message",
    title: "Message",
    primary: true,
  },
  {
    id: "timestamp",
    title: "Timestamp",
    sortKey: LOGS_SORT_KEYS.timestamp,
    align: "right",
  },
  {
    id: "sdk",
    title: "SDK Name",
    sortKey: LOGS_SORT_KEYS.sdk,
    align: "right",
  },
];

export const SAMPLE_EMPTY_PROFILE_FRAME: NanovisTreeNode = Object.freeze({
  id: "empty",
  text: "No profile data",
  subtext: "",
  sizeSelf: 0,
  size: 0,
  children: [],
  color: "#6b7280",
  frameId: -1,
  sampleCount: 0,
});
