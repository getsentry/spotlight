import path from "node:path";
import * as Sentry from "@sentry/electron/main";
import { clearBuffer, setupSidecar } from "@spotlightjs/sidecar";
import { BrowserWindow, Menu, Tray, app, dialog, ipcMain, nativeImage, shell } from "electron";
import Store from "electron-store";
import { autoUpdater } from "electron-updater";

const store = new Store();

autoUpdater.forceDevUpdateConfig = process.env.NODE_ENV === "development";

// Configure auto-updater for better network resilience
autoUpdater.autoDownload = true; // Enable automatic download when update is found
autoUpdater.autoInstallOnAppQuit = true; // Auto-install on quit

// Set longer timeouts for network operations (especially helpful for background apps)
if (process.platform === "darwin") {
  // macOS specific configuration for better background handling
  autoUpdater.logger = {
    info: (message) => console.log("AutoUpdater:", message),
    warn: (message) => console.warn("AutoUpdater:", message),
    error: (message) => console.error("AutoUpdater:", message),
    debug: (message) => console.debug("AutoUpdater:", message)
  };
}

const ONE_HOUR = 60 * 60 * 1000;
const RETRY_DELAYS = [1000, 5000, 15000, 30000, 60000]; // 1s, 5s, 15s, 30s, 1m
const MAX_RETRIES = RETRY_DELAYS.length;

let updateCheckInProgress = false;
let updateDownloadInProgress = false;
let retryCount = 0;
let retryTimeout: NodeJS.Timeout | null = null;
let lastNetworkError: any = null;
let pendingUpdateInfo: any = null;

function installAndRestart() {
  /**
   * On macOS 15+ auto-update / relaunch issues:
   * - https://github.com/electron-userland/electron-builder/issues/8795
   * - https://github.com/electron-userland/electron-builder/issues/8997
   */
  if (process.platform === "darwin") {
    app.removeAllListeners("before-quit");
    app.removeAllListeners("window-all-closed");

    for (const win of BrowserWindow.getAllWindows()) {
      if (win.isDestroyed()) continue;
      win.removeAllListeners("close");
      win.close();
    }
  }

  autoUpdater.quitAndInstall();
}

function clearRetryTimeout() {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
}

function scheduleRetry(fn: () => void, delay: number) {
  clearRetryTimeout();
  retryTimeout = setTimeout(fn, delay);
}

function resetRetryState() {
  retryCount = 0;
  clearRetryTimeout();
  lastNetworkError = null;
}

function checkNetworkConnectivity(): boolean {
  // Simple connectivity check using navigator.onLine equivalent for Electron
  return true; // Electron doesn't have a direct equivalent, we'll rely on error detection
}

function handleNetworkReconnection() {
  if (lastNetworkError && (updateCheckInProgress || updateDownloadInProgress || pendingUpdateInfo)) {
    console.log("Network appears to be back, attempting to resume update process");
    lastNetworkError = null;
    
    // Reset retry count to give fresh attempts
    retryCount = 0;
    
    // Try to resume the update process
    setTimeout(() => {
      if (pendingUpdateInfo) {
        console.log("Resuming download for pending update");
        checkForUpdatesWithRetry();
      } else if (!updateCheckInProgress) {
        console.log("Retrying update check after network recovery");
        checkForUpdatesWithRetry();
      }
    }, 2000); // Wait 2 seconds to ensure network is stable
  }
}

async function checkForUpdatesWithRetry(): Promise<void> {
  if (updateCheckInProgress) {
    console.log("Update check already in progress, skipping");
    return;
  }

  updateCheckInProgress = true;
  
  try {
    console.log(`Checking for updates (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    await autoUpdater.checkForUpdates();
    
    // Success - reset retry state
    resetRetryState();
    updateCheckInProgress = false;
    
    // Schedule next regular check
    setTimeout(checkForUpdates, ONE_HOUR);
  } catch (error) {
    console.error(`Update check failed (attempt ${retryCount + 1}):`, error);
    Sentry.captureException(error);
    
    updateCheckInProgress = false;
    
    // If we have retries left and this looks like a network error, retry
    if (retryCount < MAX_RETRIES && isNetworkError(error)) {
      lastNetworkError = error;
      const delay = RETRY_DELAYS[retryCount];
      console.log(`Retrying update check in ${delay}ms`);
      retryCount++;
      
      scheduleRetry(checkForUpdatesWithRetry, delay);
    } else {
      // Max retries reached or non-network error - reset and schedule next regular check
      console.log("Max retries reached or non-network error, scheduling next regular check");
      if (isNetworkError(error)) {
        lastNetworkError = error;
        console.log("Storing network error for potential retry on network recovery");
      }
      resetRetryState();
      setTimeout(checkForUpdates, ONE_HOUR);
    }
  }
}

function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Check for common network error indicators
  const errorString = error.toString().toLowerCase();
  const networkErrorPatterns = [
    'network connection was lost',
    'network error',
    'connection timeout',
    'connection refused',
    'dns lookup failed',
    'socket hang up',
    'enotfound',
    'econnreset',
    'econnrefused',
    'etimedout'
  ];
  
  return networkErrorPatterns.some(pattern => errorString.includes(pattern)) ||
         (error.code && error.domain === 'NSURLErrorDomain') ||
         (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT');
}

async function checkForUpdates() {
  // Reset retry state for new check cycle
  resetRetryState();
  await checkForUpdatesWithRetry();
}

app.on("ready", () => {
  checkForUpdates();

  // Handle successful update download
  autoUpdater.on("update-downloaded", async () => {
    console.log("Update downloaded successfully");
    updateDownloadInProgress = false;
    pendingUpdateInfo = null;
    resetRetryState();
    
    const result = await dialog.showMessageBox({
      type: "question",
      message: "A new update has been downloaded. It will be installed on restart.",
      buttons: ["Restart", "Later"],
    });

    if (result.response === 0) {
      installAndRestart();
    }
  });

  // Update menu when download completes
  autoUpdater.on("update-downloaded", () => {
    const menuItem = isMac ? { ...template[0].submenu?.[1] } : undefined;

    if (!menuItem) return;

    menuItem.label = "Restart to Update";
    menuItem.click = () => {
      installAndRestart();
    };

    const _template = [...template];
    if (_template[0].submenu?.[1].id === "check-for-updates") _template[0].submenu[1] = menuItem;
    Menu.setApplicationMenu(Menu.buildFromTemplate(_template));
  });

  // Handle update available
  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    updateDownloadInProgress = true;
    pendingUpdateInfo = info;
  });

  // Handle no update available
  autoUpdater.on("update-not-available", () => {
    console.log("No update available");
    updateDownloadInProgress = false;
    pendingUpdateInfo = null;
  });

  // Enhanced error handling with retry logic for downloads
  autoUpdater.on("error", (error) => {
    console.error("Auto-updater error:", error);
    Sentry.captureException(error);
    
    // If this was a download error and we have retries left, try again
    if (updateDownloadInProgress && isNetworkError(error) && retryCount < MAX_RETRIES) {
      lastNetworkError = error;
      const delay = RETRY_DELAYS[retryCount];
      console.log(`Download failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      retryCount++;
      
      scheduleRetry(() => {
        console.log("Retrying update check after download failure");
        checkForUpdatesWithRetry();
      }, delay);
    } else {
      // Reset state on non-retryable errors or max retries reached
      updateDownloadInProgress = false;
      if (retryCount >= MAX_RETRIES) {
        console.log("Max download retries reached, giving up until next scheduled check");
        if (isNetworkError(error)) {
          lastNetworkError = error;
          console.log("Storing download error for potential retry on network recovery");
        }
        resetRetryState();
      } else {
        // Non-network error, clear pending update
        pendingUpdateInfo = null;
      }
    }
  });

  // Handle download progress
  autoUpdater.on("download-progress", (progressObj) => {
    console.log(`Download progress: ${Math.round(progressObj.percent)}% (${progressObj.transferred}/${progressObj.total})`);
  });
});

Sentry.init({
  dsn: "https://192df1a78878de014eb416a99ff70269@o1.ingest.sentry.io/4506400311934976",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  release: `spotlight@${process.env.npm_package_version}`,
  beforeSend: askForPermissionToSendToSentry,
});

let alwaysOnTop = false;
let win: BrowserWindow | null = null;
let tray: Tray;
let isQuitting = false;

const isMac = process.platform === "darwin";
const isLinux = process.platform === "linux";

const createWindow = () => {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "Spotlight",
    // frame: false,
    // resizable: false,
    // maximizable: false,
    // transparent: true,
    // webPreferences: { nodeIntegration: true },
    titleBarStyle: "hidden",
    // titleBarOverlay: {
    //   color: '#2f3241',
    //   symbolColor: '#74b1be',
    //   height: 60,
    // },
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
    backgroundColor: "#1e1b4b",
  });

  // win.webContents.openDevTools();

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  win.on("close", event => {
    // Linux: always quit when window is closed, some desktop environments don't support tray apps like gnome
    if (!isQuitting && !isLinux) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on("closed", () => {
    win = null;
  });

  win.webContents.on("did-start-loading", () => {
    clearBuffer();
    app.setBadgeCount(0);
  });

  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript(
      `const spotlightRoot = document.getElementById('spotlight-root');
       if (spotlightRoot) {
         const dragHandle = document.createElement('div');
         dragHandle.style.cssText = \`
           position: fixed;
           top: 0;
           left: 0;
           right: 0;
           height: 32px;
           -webkit-app-region: drag;
           z-index: 9999;
           background: transparent;
         \`;
         dragHandle.id = 'electron-drag-handle';
         
         if (!document.getElementById('electron-drag-handle')) {
           document.body.appendChild(dragHandle);
         }
       }`,
    );
  });
};

// only quit on linux as trays may not be available on all desktop environments
app.on("window-all-closed", () => {
  if (isLinux) {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  clearRetryTimeout();
});

// Handle app state changes for better background resilience
app.on("browser-window-blur", () => {
  // App is losing focus, but continue updates
  console.log("App lost focus, continuing background updates");
});

app.on("browser-window-focus", () => {
  // App regained focus, check if we missed any updates
  console.log("App regained focus");
  
  // Check if we can recover from previous network errors
  handleNetworkReconnection();
  
  // If we're not currently checking and it's been a while, do a quick check
  if (!updateCheckInProgress && !updateDownloadInProgress) {
    // Don't wait the full hour, check in 5 seconds
    setTimeout(() => {
      console.log("Performing focus-triggered update check");
      checkForUpdates();
    }, 5000);
  }
});

// Handle app hiding/showing (macOS specific)
if (process.platform === "darwin") {
  app.on("hide", () => {
    console.log("App hidden, updates will continue in background");
  });

  app.on("show", () => {
    console.log("App shown");
  });
}

const template: Electron.MenuItemConstructorOptions[] = [
  // { role: 'appMenu' }
  ...((isMac
    ? [
        {
          label: "Spotlight",
          role: "appMenu",
          submenu: [
            { role: "about" },
            {
              id: "check-for-updates",
              label: "Check for Updates",
              click: () => {
                checkForUpdates();
              },
            },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []) satisfies Electron.MenuItemConstructorOptions[]),
  // { role: 'fileMenu' }
  {
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
  },
  // { role: 'editMenu' }
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      ...((isMac
        ? [
            { role: "pasteAndMatchStyle" },
            { role: "delete" },
            { role: "selectAll" },
            { type: "separator" },
            {
              label: "Speech",
              submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
            },
          ]
        : [
            { role: "delete" },
            { type: "separator" },
            { role: "selectAll" },
          ]) satisfies Electron.MenuItemConstructorOptions[]),
    ],
  },
  // { role: 'viewMenu' }
  {
    label: "View",
    submenu: [
      {
        label: "Reload",
        accelerator: "CmdOrCtrl+R",
        click: () => {
          try {
            win.webContents.executeJavaScript(`
            try{
              window?.__spotlight?.eventTarget.dispatchEvent(
                new CustomEvent("clearEvents", {
                  detail: {},
                }),
              );
            } catch(err){
              console.error(err)
            }
            `);
            win.webContents.reload();
          } catch (error) {
            console.error(error);
          }
        },
      },
      {
        label: "Force Reload",
        accelerator: "CmdOrCtrl+Shift+R",
        click: () => {
          try {
            win.webContents.executeJavaScript(`
            try{
              window?.__spotlight?.eventTarget.dispatchEvent(
                new CustomEvent("clearEvents", {
                  detail: {},
                }),
              );
            } catch(err){
              console.error(err)
            }
            `);
            win.webContents.reloadIgnoringCache();
          } catch (error) {
            console.error(error);
          }
        },
      },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  // { role: 'windowMenu' }
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      {
        label: "Always on Top",
        type: "checkbox",
        click: () => {
          alwaysOnTop = !alwaysOnTop;
          BrowserWindow.getFocusedWindow()?.setAlwaysOnTop(alwaysOnTop, "floating");
        },
        checked: alwaysOnTop,
      },
      ...((isMac
        ? [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }]
        : [{ role: "close" }]) satisfies Electron.MenuItemConstructorOptions[]),
    ],
  },
  {
    label: "Settings",
    submenu: [
      {
        label: "Send Error Reports",
        id: "sentry-enabled",
        type: "checkbox",
        checked: store.get("sentry-enabled") === true,
        click: () => {
          if (store.get("sentry-enabled") === undefined || store.get("sentry-enabled") === false) {
            store.set("sentry-enabled", true);
          } else {
            store.set("sentry-enabled", false);
          }
        },
      },
      {
        label: "Send Payload to Sentry",
        id: "sentry-send-envelopes",
        type: "checkbox",
        checked: store.get("sentry-send-envelopes") === true,
        click: () => {
          if (store.get("sentry-send-envelopes") === undefined || store.get("sentry-send-envelopes") === false) {
            store.set("sentry-send-envelopes", true);
          } else {
            store.set("sentry-send-envelopes", false);
          }
        },
      },
      { type: "separator" },
      {
        label: "Start at Login",
        id: "start-at-login",
        type: "checkbox",
        checked: app.getLoginItemSettings().openAtLogin,
        click: () => {
          const currentSetting = app.getLoginItemSettings().openAtLogin;
          app.setLoginItemSettings({
            openAtLogin: !currentSetting,
            openAsHidden: true,
          });
        },
      },
    ],
  },
  {
    role: "help",
    submenu: [
      {
        label: "Learn More",
        click: async () => {
          await shell.openExternal("https://spotlightjs.com");
        },
      },
    ],
  },
];

function handleBadgeCount(_event, count) {
  app.setBadgeCount(count);
}
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

store.onDidChange("sentry-enabled", newValue => {
  const item = menu.getMenuItemById("sentry-enabled");
  if (item) {
    item.checked = newValue as boolean;
  }
});

store.onDidChange("sentry-send-envelopes", newValue => {
  const item = menu.getMenuItemById("sentry-send-envelopes");
  if (item) {
    item.checked = newValue as boolean;
  }
});

const showErrorMessage = () => {
  if (win) {
    win.webContents.executeJavaScript(`{
      const sentryRoot = document.getElementById('spotlight-root');
      const errorScreen = document.getElementById('error-screen');
      if (sentryRoot) {
        sentryRoot.style.display = 'none';
      }
      if (errorScreen) {
        errorScreen.style.display = 'block';
      }
    }`);
  }
};

async function askForPermissionToSendToSentry(event: Sentry.Event, hint: Sentry.EventHint) {
  showErrorMessage();
  if (store.get("sentry-enabled") === false) {
    return null;
  }
  if (store.get("sentry-enabled") === true) {
    if (hint.attachments && hint.attachments.length > 0) {
      return askToSendEnvelope(event, hint);
    }
    return event;
  }

  const { response } = await dialog.showMessageBox({
    type: "question",
    buttons: ["Yes", "No"],
    title: "Spotlight",
    message: "Spotlight encountered an error. Would you like to send an error report to the developers?",
    detail: "This will help us improve Spotlight. (Can be changed in the settings menu)",
  });

  if (response === 1) {
    store.set("sentry-enabled", false);
    return null;
  }

  store.set("sentry-enabled", true);
  if (hint?.attachments && hint.attachments.length > 0) {
    return askToSendEnvelope(event, hint);
  }
  return event;
}

async function askToSendEnvelope(event: Sentry.Event, hint?: Sentry.EventHint) {
  if (store.get("sentry-send-envelopes") === false) {
    return null;
  }
  if (store.get("sentry-send-envelopes") === true) {
    return event;
  }

  const { response } = await dialog.showMessageBox({
    type: "question",
    buttons: ["Yes", "No"],
    title: "Spotlight",
    message: "Can we also send the payload Spotlight received so we can fully reproduce the error?",
    detail: "Again, just makes things easier for us. (Can be changed in the settings menu)",
  });

  if (response === 1) {
    Sentry.getCurrentScope().clearAttachments();
    if (hint?.attachments && hint.attachments.length > 0) {
      hint.attachments = [];
    }
    store.set("sentry-send-envelopes", false);
    return event;
  }

  store.set("sentry-send-envelopes", true);
  return event;
}

function storeIncomingPayload(body: string) {
  if (store.get("sentry-send-envelopes") === true || store.get("sentry-send-envelopes") === undefined) {
    const scope = Sentry.getCurrentScope();
    scope.clearAttachments();
    scope.addAttachment({
      data: body,
      filename: "payload.txt",
      contentType: "text/plain",
    });
  }
}

function showOrCreateWindow() {
  if (isQuitting) {
    return;
  }

  if (!win || win.isDestroyed()) {
    createWindow();
    return;
  }

  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  win.focus();
}

function createTray() {
  const iconPath = path.join(__dirname, "../../resources/tray/tray.png");
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Spotlight",
      click: () => showOrCreateWindow(),
    },
    {
      label: "Sidecar Status",
      enabled: false,
      sublabel: "Running on port 8969",
    },
    { type: "separator" },
    {
      label: "Start at Login",
      type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      click: () => {
        const currentSetting = app.getLoginItemSettings().openAtLogin;
        app.setLoginItemSettings({
          openAtLogin: !currentSetting,
          openAsHidden: true,
        });
      },
    },
    { type: "separator" },
    {
      label: "Quit Spotlight",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Spotlight - Sidecar is running");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    showOrCreateWindow();
  });

  tray.on("double-click", () => {
    showOrCreateWindow();
  });
}

app.whenReady().then(() => {
  if (!isLinux) {
    createTray();
  }

  createWindow();
  app.on("activate", () => {
    showOrCreateWindow();
  });

  ipcMain.on("set-badge-count", handleBadgeCount);

  setupSidecar({
    port: 8969,
    incomingPayload: storeIncomingPayload,
    isStandalone: true,
  });
});
