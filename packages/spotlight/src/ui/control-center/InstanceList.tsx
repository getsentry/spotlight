import { useState } from "react";
import { Input } from "@spotlight/ui/ui/input";
import type { InstanceInfo } from "../telemetry/store/slices/instancesSlice";
import { InstanceCard } from "./InstanceCard";

type InstanceListProps = {
  instances: InstanceInfo[];
  currentInstanceId: string | null;
  onConnect: (port: number) => void;
  onTerminate: (instanceId: string) => void;
};

export function InstanceList({ instances, currentInstanceId, onConnect, onTerminate }: InstanceListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInstances = instances.filter(instance => {
    const search = searchTerm.toLowerCase();
    return (
      instance.projectName.toLowerCase().includes(search) ||
      instance.command.toLowerCase().includes(search) ||
      instance.port.toString().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Spotlight Instances ({instances.length})
        </h2>
        <Input
          type="text"
          placeholder="Search instances..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filteredInstances.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">
          {searchTerm ? "No instances match your search." : "No Spotlight instances are currently running."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInstances.map(instance => (
            <InstanceCard
              key={instance.instanceId}
              instance={instance}
              isCurrentInstance={instance.instanceId === currentInstanceId}
              onConnect={onConnect}
              onTerminate={onTerminate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
