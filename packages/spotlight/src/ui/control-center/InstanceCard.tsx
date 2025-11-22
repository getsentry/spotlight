import { Badge } from "@spotlight/ui/ui/badge";
import { Button } from "@spotlight/ui/ui/button";
import type { InstanceInfo } from "../telemetry/store/slices/instancesSlice";

type InstanceCardProps = {
  instance: InstanceInfo;
  isCurrentInstance: boolean;
  onConnect: (port: number) => void;
  onTerminate: (instanceId: string) => void;
};

function formatUptime(uptime?: number): string {
  if (!uptime) return "?";
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function getStatusBadgeVariant(status: InstanceInfo["status"]): "default" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "healthy":
      return "secondary";
    case "unresponsive":
      return "warning";
    case "orphaned":
      return "warning";
    case "dead":
      return "destructive";
    default:
      return "default";
  }
}

export function InstanceCard({ instance, isCurrentInstance, onConnect, onTerminate }: InstanceCardProps) {
  const handleConnect = () => {
    if (!isCurrentInstance) {
      onConnect(instance.port);
    }
  };

  const handleTerminate = () => {
    if (window.confirm(`Are you sure you want to terminate ${instance.projectName}?`)) {
      onTerminate(instance.instanceId);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isCurrentInstance ? "border-blue-500 bg-blue-50/10" : "border-neutral-700 bg-neutral-800/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{instance.projectName}</h3>
            <Badge variant={getStatusBadgeVariant(instance.status)}>{instance.status}</Badge>
            {isCurrentInstance && <Badge variant="primary">Current</Badge>}
          </div>
          <div className="mt-2 space-y-1 text-sm text-neutral-400">
            <div>
              <span className="font-medium">Port:</span> {instance.port}
            </div>
            <div>
              <span className="font-medium">Command:</span> {instance.command}
            </div>
            <div>
              <span className="font-medium">Type:</span> {instance.detectedType}
            </div>
            <div>
              <span className="font-medium">Uptime:</span> {formatUptime(instance.uptime)}
            </div>
            <div>
              <span className="font-medium">URL:</span>{" "}
              <a
                href={`http://localhost:${instance.port}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                http://localhost:{instance.port}
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {!isCurrentInstance && instance.status === "healthy" && (
            <Button size="sm" onClick={handleConnect}>
              Connect
            </Button>
          )}
          {instance.status !== "dead" && (
            <Button size="sm" variant="destructive" onClick={handleTerminate}>
              Terminate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
