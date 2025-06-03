import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  setBadgeCount: count => ipcRenderer.send("set-badge-count", count),
});
