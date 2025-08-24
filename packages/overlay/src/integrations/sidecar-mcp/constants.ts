export const SIDECAR_MCP_CONTENT_TYPE = "spotlight-sidecar-mcp";

export const SIDECAR_MCP_SORT_KEYS = {
  timestamp: "TIMESTAMP",
  method: "METHOD",
  tool: "TOOL",
  status: "STATUS",
};

export const SIDECAR_MCP_HEADERS = [
  {
    id: "status",
    title: "Status",
    sortKey: SIDECAR_MCP_SORT_KEYS.status,
  },
  {
    id: "method",
    title: "Method",
    sortKey: SIDECAR_MCP_SORT_KEYS.method,
    primary: true,
  },
  {
    id: "tool",
    title: "Tool",
    sortKey: SIDECAR_MCP_SORT_KEYS.tool,
  },
  {
    id: "timestamp",
    title: "Time",
    sortKey: SIDECAR_MCP_SORT_KEYS.timestamp,
    align: "right",
  },
];
