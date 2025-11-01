export interface IElectronAPI {
  setBadgeCount: (count: number) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
