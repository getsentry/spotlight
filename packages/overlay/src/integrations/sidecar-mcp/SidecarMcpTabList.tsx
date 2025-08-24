import { type KeyboardEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactComponent as Sort } from "~/assets/sort.svg";
import { ReactComponent as SortDown } from "~/assets/sortDown.svg";
import useSort from "~/integrations/hooks/useSort";
import { cn } from "~/lib/cn";
import { Badge } from "~/ui/badge";
import Table from "~/ui/table";
import SidecarMcpInteractionDetails from "./SidecarMcpInteractionDetails";
import { SIDECAR_MCP_HEADERS, SIDECAR_MCP_SORT_KEYS } from "./constants";
import useSidecarMcpStore from "./store";
import type { SidecarMcpInteraction } from "./types";

type SidecarMcpSortTypes = (typeof SIDECAR_MCP_SORT_KEYS)[keyof typeof SIDECAR_MCP_SORT_KEYS];

const COMPARATORS: Record<SidecarMcpSortTypes, (a: SidecarMcpInteraction, b: SidecarMcpInteraction) => number> = {
  [SIDECAR_MCP_SORT_KEYS.timestamp]: (a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  },
  [SIDECAR_MCP_SORT_KEYS.method]: (a, b) => {
    return a.method.localeCompare(b.method);
  },
  [SIDECAR_MCP_SORT_KEYS.tool]: (a, b) => {
    const toolA = a.tool || "";
    const toolB = b.tool || "";
    if (toolA < toolB) return -1;
    if (toolA > toolB) return 1;
    return 0;
  },
  [SIDECAR_MCP_SORT_KEYS.status]: (a, b) => {
    if (a.success === b.success) return 0;
    return a.success ? 1 : -1; // Errors first
  },
};

// Helper function to check if an interaction is a tool call
const isToolCall = (interaction: SidecarMcpInteraction): boolean => {
  return Boolean(interaction.tool);
};

export default function SidecarMcpTabList() {
  const { interactions } = useSidecarMcpStore();
  const navigate = useNavigate();
  const params = useParams();
  const { id: selectedInteractionId } = params;
  const { sort, toggleSortOrder } = useSort({ defaultSortType: SIDECAR_MCP_SORT_KEYS.timestamp, defaultAsc: false });
  const [showOnlyToolCalls, setShowOnlyToolCalls] = useState(false);

  console.log(params);

  const handleRowClick = (interaction: SidecarMcpInteraction) => {
    navigate(`${interaction.id}`);
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, interaction: SidecarMcpInteraction) => {
    if (e.key === "Enter") {
      handleRowClick(interaction);
    }
  };

  const filteredAndSortedInteractions = useMemo(() => {
    if (!interactions || interactions.length === 0) return [];

    const filteredInteractions = showOnlyToolCalls ? interactions.filter(isToolCall) : interactions;

    const compareInteractions =
      COMPARATORS[sort.active as SidecarMcpSortTypes] || COMPARATORS[SIDECAR_MCP_SORT_KEYS.timestamp];
    return [...filteredInteractions].sort((a, b) => {
      return sort.asc ? compareInteractions(a, b) : compareInteractions(b, a);
    });
  }, [interactions, sort.active, sort.asc, showOnlyToolCalls]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!interactions || interactions.length === 0 ? (
        <div className="text-primary-300 p-6">No Sidecar MCP interactions recorded yet.</div>
      ) : filteredAndSortedInteractions.length === 0 ? (
        <>
          <div className="flex items-center gap-3 px-6 py-3 border-b border-primary-800/30 bg-primary-950/50">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-primary-200">
              <input
                type="checkbox"
                checked={showOnlyToolCalls}
                onChange={e => setShowOnlyToolCalls(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-primary-900 border-primary-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              Show only tool calls
            </label>
            <span className="text-xs text-primary-400">(0 of {interactions.length} interactions)</span>
          </div>
          <div className="text-primary-300 p-6">
            No tool call interactions found.{" "}
            {showOnlyToolCalls ? "Try unchecking the filter to see all interactions." : ""}
          </div>
        </>
      ) : (
        <>
          {/* Filter Controls */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-primary-800/30 bg-primary-950/50">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-primary-200">
              <input
                type="checkbox"
                checked={showOnlyToolCalls}
                onChange={e => setShowOnlyToolCalls(e.target.checked)}
                className="w-4 h-4 text-primary-500 bg-primary-900 border-primary-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              Show only tool calls
            </label>
            <span className="text-xs text-primary-400">
              ({filteredAndSortedInteractions.length} of {interactions.length} interactions)
            </span>
          </div>
          <Table variant="detail" className="w-full">
            <Table.Header>
              <tr className="border-b border-primary-800">
                {SIDECAR_MCP_HEADERS.map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      "text-primary-100 select-none px-6 py-3.5 text-sm font-semibold",
                      header.primary ? "w-1/2" : "w-1/4",
                      header.align === "right" && "text-right",
                    )}
                  >
                    <div
                      className={cn(
                        "flex cursor-pointer select-none items-center gap-1",
                        header.align === "right" ? "justify-end" : "justify-start",
                      )}
                      onClick={() => header.sortKey && toggleSortOrder(header.sortKey)}
                    >
                      {header.title}
                      {header.sortKey &&
                        (sort.active === header.sortKey ? (
                          <SortDown
                            width={12}
                            height={12}
                            className={cn(
                              "fill-primary-300",
                              sort.asc ? "-translate-y-0.5 rotate-0" : "translate-y-0.5 rotate-180",
                            )}
                          />
                        ) : (
                          <Sort width={12} height={12} className="stroke-primary-300" />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </Table.Header>
            <Table.Body>
              {filteredAndSortedInteractions.map(interaction => (
                <tr
                  key={interaction.id}
                  className="hover:bg-primary-900/50 cursor-pointer transition-colors border-b border-primary-800/30"
                  onClick={() => handleRowClick(interaction)}
                  onKeyDown={e => handleRowKeyDown(e, interaction)}
                >
                  <td className="px-6 py-4 w-1/4">
                    <Badge
                      variant={interaction.success ? "default" : "destructive"}
                      className={
                        interaction.success
                          ? "bg-green-600/20 text-green-300 border-green-500/30"
                          : "bg-red-600/20 text-red-300 border-red-500/30"
                      }
                    >
                      {interaction.success ? "Success" : "Error"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 w-1/2">
                    <span className="font-mono text-sm text-primary-100 font-medium">{interaction.method}</span>
                  </td>
                  <td className="px-6 py-4 w-1/4">
                    {interaction.tool ? (
                      <Badge
                        variant="outline"
                        className="text-xs bg-primary-800/50 text-primary-200 border-primary-600/50"
                      >
                        {interaction.tool}
                      </Badge>
                    ) : (
                      <span className="text-primary-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right w-1/4">
                    <span className="text-xs text-primary-400">
                      {new Date(interaction.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                </tr>
              ))}
            </Table.Body>
          </Table>

          {selectedInteractionId && <SidecarMcpInteractionDetails interactionId={selectedInteractionId} />}
        </>
      )}
    </div>
  );
}
