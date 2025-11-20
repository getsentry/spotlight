import { useEffect } from "react";
import { Button } from "@spotlight/ui/ui/button";
import useSentryStore from "../telemetry/store";
import { getConnectionManager } from "../lib/connectionManager";
import { InstanceList } from "./InstanceList";
import { connectToSidecar } from "../sidecar";
import { SENTRY_CONTENT_TYPE } from "@spotlight/shared/constants.ts";

type ControlCenterProps = {
  sidecarUrl: string;
  onClose?: () => void;
};

export function ControlCenter({ onClose }: ControlCenterProps) {
  const {
    instances,
    currentInstanceId,
    isLoadingInstances,
    fetchInstances,
    terminateInstance,
    addOrUpdateInstance,
    resetData,
  } = useSentryStore();

  // Fetch instances on mount and set up periodic refresh
  useEffect(() => {
    fetchInstances();

    // Refresh every 10 seconds to clean up stale instances
    const interval = setInterval(() => {
      fetchInstances();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchInstances]);

  // Listen for instance ping events via SSE
  // Note: This would require additional setup to handle SSE events
  // For now, we rely on periodic polling via fetchInstances

  const handleConnect = async (port: number) => {
    const connectionManager = getConnectionManager();

    try {
      await connectionManager.switchInstance(
        port,
        url => {
          // Connect to new sidecar
          const contentTypeListeners: Record<string, (event: string) => void> = {
            [SENTRY_CONTENT_TYPE]: event => {
              const envelope = typeof event === "string" ? JSON.parse(event) : event;
              useSentryStore.getState().pushEnvelope(envelope);
            },
            [`${SENTRY_CONTENT_TYPE};base64`]: event => {
              const envelope = typeof event === "string" ? JSON.parse(event) : event;
              useSentryStore.getState().pushEnvelope(envelope);
            },
          };

          return connectToSidecar(url, contentTypeListeners, () => {});
        },
        () => {
          // Reset store
          resetData();
        }
      );

      // Find and set the current instance ID
      const targetInstance = instances.find(i => i.port === port);
      if (targetInstance) {
        useSentryStore.setState({ currentInstanceId: targetInstance.instanceId });
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Failed to switch instance:", err);
      alert("Failed to switch to the selected instance. Please try again.");
    }
  };

  const handleTerminate = async (instanceId: string) => {
    const success = await terminateInstance(instanceId);
    if (success) {
      // Refresh the list
      fetchInstances();
    } else {
      alert("Failed to terminate the instance. It may already be stopped.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-white">
      <div className="border-b border-neutral-700 p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spotlight Control Center</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchInstances()}
            disabled={isLoadingInstances}
          >
            {isLoadingInstances ? "Refreshing..." : "Refresh"}
          </Button>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <InstanceList
          instances={instances}
          currentInstanceId={currentInstanceId}
          onConnect={handleConnect}
          onTerminate={handleTerminate}
        />
      </div>
    </div>
  );
}
