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
