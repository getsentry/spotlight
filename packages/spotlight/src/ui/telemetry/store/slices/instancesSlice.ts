import type { StateCreator } from "zustand";
import type { InstancesSliceActions, InstancesSliceState, SentryStore } from "../types";

export type InstanceInfo = {
  instanceId: string;
  port: number;
  pid: number;
  pidStartTime: number;
  childPid: number | null;
  childPidStartTime: number | null;
  command: string;
  cmdArgs: string[];
  cwd: string;
  startTime: string;
  projectName: string;
  detectedType: string;
  status: "healthy" | "unresponsive" | "dead" | "orphaned";
  uptime?: number;
};

const initialInstancesState: InstancesSliceState = {
  instances: [],
  currentInstanceId: null,
  isLoadingInstances: false,
};

export const createInstancesSlice: StateCreator<SentryStore, [], [], InstancesSliceState & InstancesSliceActions> = (
  set,
  get,
) => ({
  ...initialInstancesState,

  setInstances: (instances: InstanceInfo[]) => {
    set({ instances });
  },

  addOrUpdateInstance: (instance: InstanceInfo) => {
    const { instances } = get();
    const existingIndex = instances.findIndex(i => i.instanceId === instance.instanceId);

    if (existingIndex >= 0) {
      // Update existing instance
      const newInstances = [...instances];
      newInstances[existingIndex] = instance;
      set({ instances: newInstances });
    } else {
      // Add new instance
      set({ instances: [...instances, instance] });
    }
  },

  removeInstance: (instanceId: string) => {
    const { instances } = get();
    set({ instances: instances.filter(i => i.instanceId !== instanceId) });
  },

  setCurrentInstance: (instanceId: string | null) => {
    set({ currentInstanceId: instanceId });
  },

  setLoadingInstances: (isLoading: boolean) => {
    set({ isLoadingInstances: isLoading });
  },

  fetchInstances: async () => {
    try {
      set({ isLoadingInstances: true });
      const response = await fetch("/api/instances");
      if (response.ok) {
        const instances = await response.json();
        set({ instances, isLoadingInstances: false });
      } else {
        console.error("Failed to fetch instances:", response.statusText);
        set({ isLoadingInstances: false });
      }
    } catch (err) {
      console.error("Failed to fetch instances:", err);
      set({ isLoadingInstances: false });
    }
  },

  terminateInstance: async (instanceId: string) => {
    try {
      const response = await fetch(`/api/instances/${instanceId}/terminate`, {
        method: "POST",
      });

      if (response.ok) {
        // Remove from local state
        get().removeInstance(instanceId);
        return true;
      } else {
        console.error("Failed to terminate instance:", response.statusText);
        return false;
      }
    } catch (err) {
      console.error("Failed to terminate instance:", err);
      return false;
    }
  },
});
