export const DB_SPAN_REGEX = /^db(?:\.[A-Za-z]+)*$/;

export const RESOURCES_SORT_KEYS = {
  avgDuration: 'AVG_DURATION',
  timeSpent: 'TIME_SPENT',
  description: 'DESC',
  avgEncodedSize: 'AVG_ENCODED_SIZE',
};

export const RESOURCE_HEADERS = [
  {
    id: 'description',
    title: 'Resource Description',
    sortKey: RESOURCES_SORT_KEYS.description,
    primary: true,
  },
  {
    id: 'avgDuration',
    title: 'Avg Duration',
    sortKey: RESOURCES_SORT_KEYS.avgDuration,
  },
  {
    id: 'timeSpent',
    title: 'Time Spent',
    sortKey: RESOURCES_SORT_KEYS.timeSpent,
  },
  {
    id: 'avgEncodedSize',
    title: 'Avg Encoded Size',
    sortKey: RESOURCES_SORT_KEYS.avgEncodedSize,
  },
];

export const QUERIES_SORT_KEYS = {
  queryDesc: 'QUERY_DESCRIPTION',
  timeSpent: 'TIME_SPENT',
  avgDuration: 'AVG_DURATION',
};

export const QUERIES_HEADERS = [
  {
    id: 'queryDesc',
    title: 'Query Description',
    sortKey: QUERIES_SORT_KEYS.queryDesc,
    primary: true,
  },
  {
    id: 'avgDuration',
    title: 'Avg Duration',
    sortKey: QUERIES_SORT_KEYS.avgDuration,
  },
  {
    id: 'timeSpent',
    title: 'Time Spent',
    sortKey: QUERIES_SORT_KEYS.timeSpent,
  },
];

export const TRANSACTIONS_SORT_KEYS = {
  count: 'count',
  lastSeen: 'lastSeen',
  // TODO:
  // profiles: 'PROFILES',
};

export const TRANSACTIONS_TABLE_HEADERS = [
  {
    id: 'transaction',
    title: 'Transaction',
    primary: true,
  },
  {
    id: 'lastSeen',
    title: 'Last Seen',
    sortKey: TRANSACTIONS_SORT_KEYS.lastSeen,
  },
  {
    id: 'count',
    title: 'Count',
    sortKey: TRANSACTIONS_SORT_KEYS.count,
  },
  // TODO:
  // {
  //   id: 'profiles',
  //   title: 'Total Profiles',
  //   sortKey: TRANSACTIONS_SORT_KEYS.profiles,
  // },
];

export const TRANSACTION_SUMMARY_SORT_KEYS = {
  timestamp: 'timestamp',
  duration: 'duration',
};

export const TRANSACTION_SUMMARY_TABLE_HEADERS = [
  {
    id: 'eventId',
    title: 'Event Id',
    primary: true,
  },
  {
    id: 'toalDuration',
    title: 'Total Duration',
    sortKey: TRANSACTION_SUMMARY_SORT_KEYS.duration,
  },
  {
    id: 'timestamp',
    title: 'Timestamp',
    sortKey: TRANSACTION_SUMMARY_SORT_KEYS.timestamp,
  },
  {
    id: 'traceId',
    title: 'Trace Id',
  },
];
export const QUERY_SUMMARY_SORT_KEYS = {
  foundIn: 'FOUND_IN',
  spanId: 'SPAN_ID',
  timeSpent: 'TIME_SPENT',
};

export const QUERY_SUMMARY_HEADERS = [
  {
    id: 'foundIn',
    title: 'Found In',
    sortKey: QUERY_SUMMARY_SORT_KEYS.foundIn,
    primary: true,
  },
  {
    id: 'spanId',
    title: 'Span Id',
    sortKey: QUERY_SUMMARY_SORT_KEYS.spanId,
  },
  {
    id: 'timeSpent',
    title: 'Time Spent',
    sortKey: QUERY_SUMMARY_SORT_KEYS.timeSpent,
  },
];

export const WEB_VITALS_SORT_KEYS = {
  pages: 'Pages',
  lcp: 'LCP',
  fcp: 'FCP',
  fid: 'FID',
  cls: 'CLS',
  ttfb: 'TTFB',
  score: 'PERFORMANCE_TOTAL_SCORE',
};

export const WEB_VITALS_HEADERS = [
  {
    id: 'pages',
    title: 'Pages',
    sortKey: WEB_VITALS_SORT_KEYS.pages,
    primary: true,
  },
  {
    id: 'lcp',
    title: 'LCP',
    sortKey: WEB_VITALS_SORT_KEYS.lcp,
  },
  {
    id: 'fcp',
    title: 'FCP',
    sortKey: WEB_VITALS_SORT_KEYS.fcp,
  },
  {
    id: 'fid',
    title: 'FID',
    sortKey: WEB_VITALS_SORT_KEYS.fid,
  },
  {
    id: 'cls',
    title: 'CLS',
    sortKey: WEB_VITALS_SORT_KEYS.cls,
  },
  {
    id: 'ttfb',
    title: 'TTFB',
    sortKey: WEB_VITALS_SORT_KEYS.ttfb,
  },
  {
    id: 'score',
    title: 'Perf Score',
    sortKey: WEB_VITALS_SORT_KEYS.score,
  },
];

export type WebVitals = 'lcp' | 'fcp' | 'cls' | 'ttfb' | 'fid';

export const PERFORMANCE_SCORE_PROFILES = {
  profiles: [
    {
      name: 'Chrome',
      scoreComponents: [
        { measurement: 'fcp', weight: 0.15, p10: 900.0, p50: 1600.0, optional: false },
        { measurement: 'lcp', weight: 0.3, p10: 1200.0, p50: 2400.0, optional: false },
        { measurement: 'fid', weight: 0.3, p10: 100.0, p50: 300.0, optional: true },
        { measurement: 'cls', weight: 0.15, p10: 0.1, p50: 0.25, optional: false },
        { measurement: 'ttfb', weight: 0.1, p10: 200.0, p50: 400.0, optional: false },
      ],
      condition: { op: 'eq', name: 'event.contexts.browser.name', value: 'Chrome' },
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
