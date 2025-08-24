import { create } from "zustand";
import type { SidecarMcpInteraction } from "./types";

interface SidecarMcpStore {
  interactions: SidecarMcpInteraction[];
  addInteraction: (interaction: SidecarMcpInteraction) => void;
  clearInteractions: () => void;
  getInteractions: () => SidecarMcpInteraction[];
}

const useSidecarMcpStore = create<SidecarMcpStore>((set, get) => ({
  interactions: [],

  addInteraction: (interaction: SidecarMcpInteraction) => {
    set(state => ({
      interactions: [...state.interactions, interaction],
    }));
  },

  clearInteractions: () => {
    set({ interactions: [] });
  },

  getInteractions: () => {
    return get().interactions;
  },
}));

export default useSidecarMcpStore;
