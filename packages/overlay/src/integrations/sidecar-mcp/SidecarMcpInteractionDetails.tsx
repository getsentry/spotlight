import JsonViewer from "~/components/JsonViewer";
import { Badge } from "~/ui/badge";
import SidePanel, { SidePanelHeader } from "~/ui/sidePanel";
import useSidecarMcpStore from "./store";
import { getFormattedDuration } from "./utils";

interface SidecarMcpInteractionDetailsProps {
  interactionId: string;
}

export default function SidecarMcpInteractionDetails({ interactionId }: SidecarMcpInteractionDetailsProps) {
  const { interactions } = useSidecarMcpStore();
  const interaction = interactions.find(i => i.id === interactionId);

  if (!interaction) {
    return (
      <SidePanel backto="/sidecar-mcp">
        <SidePanelHeader
          title="Interaction Not Found"
          subtitle="The requested interaction could not be found"
          backto="/sidecar-mcp"
        />
        <div className="p-6 text-center text-primary-300">
          Interaction with ID "{interactionId}" was not found. It may have been cleared or expired.
        </div>
      </SidePanel>
    );
  }

  return (
    <SidePanel backto="/sidecar-mcp">
      <SidePanelHeader
        title="Sidecar MCP Interaction Details"
        subtitle={
          <div className="flex items-center gap-2">
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
            <span className="text-primary-300">{interaction.method}</span>
            {interaction.tool && (
              <Badge variant="outline" className="text-xs bg-primary-800/50 text-primary-200 border-primary-600/50">
                {interaction.tool}
              </Badge>
            )}
          </div>
        }
        backto="/sidecar-mcp"
      />

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="mb-2 font-bold uppercase text-primary-200">TIMING</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-400">Duration:</span>
                <span className="text-primary-100 font-mono">{getFormattedDuration(interaction.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-400">Timestamp:</span>
                <span className="text-primary-100 font-mono">
                  {interaction.timestamp ? new Date(interaction.timestamp).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-bold uppercase text-primary-200">CLIENT INFO</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-400">Client:</span>
                <span className="text-primary-100">{interaction.client || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-400">Method:</span>
                <span className="text-primary-100 font-mono">{interaction.method || "N/A"}</span>
              </div>
              {interaction.tool && (
                <div className="flex justify-between">
                  <span className="text-primary-400">Tool:</span>
                  <span className="text-primary-100">{interaction.tool}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Parameters */}
        {interaction.input && Object.keys(interaction.input).length > 0 && (
          <div>
            <h2 className="mb-2 font-bold uppercase text-primary-200">INPUT PARAMETERS</h2>
            <JsonViewer data={interaction.input} />
          </div>
        )}

        {/* Error Details */}
        {interaction.error && (
          <div>
            <h2 className="mb-2 font-bold uppercase text-red-400">ERROR DETAILS</h2>
            <div className="bg-red-950/20 border border-red-800 rounded-md p-4">
              <pre className="text-sm text-red-300 whitespace-pre-wrap">{interaction.error}</pre>
            </div>
          </div>
        )}

        {/* Output Results */}
        {interaction.output && Object.keys(interaction.output).length > 0 && (
          <div>
            <h2 className="mb-2 font-bold uppercase text-primary-200">OUTPUT RESULTS</h2>
            <JsonViewer data={interaction.output} />
          </div>
        )}

        {/* Debug Info */}
        <div>
          <h2 className="mb-2 font-bold uppercase text-primary-200">DEBUG INFO</h2>
          <JsonViewer data={interaction} />
        </div>
      </div>
    </SidePanel>
  );
}
