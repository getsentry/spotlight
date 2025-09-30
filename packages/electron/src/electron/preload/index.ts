import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  setBadgeCount: count => ipcRenderer.send("set-badge-count", count),
});

// This is used to determine if the overlay is running inside electron
contextBridge.exposeInMainWorld("IN_DESKTOP_ENV", true);
