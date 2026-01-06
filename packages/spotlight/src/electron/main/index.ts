import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Sentry from "@sentry/electron/main";
import { BrowserWindow, Menu, Tray, app, dialog, nativeImage, shell } from "electron";
import Store from "electron-store";
import { autoUpdater } from "electron-updater";
import { sentryBaseConfig } from "../../sentry-config";
import { DEFAULT_PORT } from "../../server/constants";
import { setupSpotlight } from "../../server/main";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();

autoUpdater.forceDevUpdateConfig = process.env.NODE_ENV === "development";

const ONE_HOUR = 60 * 60 * 1000;

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

let checkingForUpdatesTimeout: NodeJS.Timeout | null = null;
let isCheckingForUpdates = false;
async function checkForUpdates() {
  if (isCheckingForUpdates) {
    return;
  }

  isCheckingForUpdates = true;
  if (checkingForUpdatesTimeout) {
    clearTimeout(checkingForUpdatesTimeout);
    checkingForUpdatesTimeout = null;
  }

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error(error);
    Sentry.withScope(scope => {
      scope.setTag("error_source", "updater");
      Sentry.captureException(error);
    });
  }

  isCheckingForUpdates = false;
  checkingForUpdatesTimeout = setTimeout(checkForUpdates, ONE_HOUR);
  checkingForUpdatesTimeout.unref();
}

app.on("ready", () => {
  checkForUpdates();

  autoUpdater.on("update-downloaded", async () => {
    const menuItem = isMac ? { ...template[0].submenu?.[1] } : undefined;

    if (menuItem) {
      menuItem.label = "Restart to Update";
      menuItem.click = () => installAndRestart();

      const _template = [...template];
      if (_template[0].submenu?.[1].id === "check-for-updates") _template[0].submenu[1] = menuItem;
      Menu.setApplicationMenu(Menu.buildFromTemplate(_template));
    }

    const result = await dialog.showMessageBox({
      type: "question",
      message: "A new update has been downloaded. It will be installed on restart.",
      buttons: ["Restart", "Later"],
    });

    if (result.response === 0) {
      installAndRestart();
    }
  });

  autoUpdater.on("error", error => {
    Sentry.withScope(scope => {
      scope.setTag("error_source", "updater");
      Sentry.captureException(error);
    });
  });
});

Sentry.init({
  ...sentryBaseConfig,
  dsn: "https://192df1a78878de014eb416a99ff70269@o1.ingest.sentry.io/4506400311934976",
  integrations: [
    Sentry.consoleLoggingIntegration({
      levels: ["log", "info", "warn", "error", "debug"],
    }),
  ],
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
    // transparent: true,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 16, y: 16 },
    titleBarOverlay: {
      color: "#1e1b4b",
      symbolColor: "#74b1be",
    },
    webPreferences: {
      nodeIntegration: true,
      sandbox: false,
    },
    backgroundColor: "#1e1b4b",
  });

  // vite-plugin-electron sets VITE_DEV_SERVER_URL during development
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
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

  // Toggle fullscreen class on body - CSS rules handle visibility
  win.on("enter-full-screen", () => {
    win.webContents.executeJavaScript(`document.body.classList.add('electron-fullscreen');`);
  });

  win.on("leave-full-screen", () => {
    win.webContents.executeJavaScript(`document.body.classList.remove('electron-fullscreen');`);
  });

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url).catch(error => {
      Sentry.captureException(error);
    });
    return { action: "deny" };
  });

  win.webContents.on("did-finish-load", () => {
    app.setBadgeCount(0);

    /**
     * Need to create these elements here as Spotlight.init() function
     * replaces the body content with the app root. This runs after the app
     * is loaded.
     */
    win.webContents.executeJavaScript(
      `(function() {
        // Add platform class to body for CSS-based platform detection
        document.body.classList.add('electron', 'electron-${process.platform}');

        if (!document.getElementById('electron-top-drag-bar')) {
          const dragBar = document.createElement('div');
          dragBar.id = 'electron-top-drag-bar';
          dragBar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:40px;-webkit-app-region:drag;z-index:99999;';
          document.body.appendChild(dragBar);
        }
        
        // Re-create elements if body is replaced.
        // This can happen when Spotlight.init() replaces the entire body content
        // during hot module replacement (HMR) in development mode, or when the
        // React app fully remounts after initial hydration.
        new MutationObserver(() => {
          // Re-add platform classes if body was replaced
          if (!document.body.classList.contains('electron')) {
            document.body.classList.add('electron', 'electron-${process.platform}');
          }
          if (!document.getElementById('electron-top-drag-bar')) {
            const dragBar = document.createElement('div');
            dragBar.id = 'electron-top-drag-bar';
            dragBar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:40px;-webkit-app-region:drag;z-index:99999;';
            document.body.appendChild(dragBar);
          }
        }).observe(document.body, { childList: true });
      })();
    `,
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
});

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
              click: () => checkForUpdates(),
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

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(isMac ? menu : null);

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

async function askForPermissionToSendToSentry(event: Sentry.Event, hint: Sentry.EventHint) {
  // Handle updater errors silently - no dialogs or error screens
  if (event.tags?.error_source === "updater") {
    // Only send if user has explicitly enabled error reporting
    if (store.get("sentry-enabled") === false) {
      return null;
    }
    // For updater errors, send silently if enabled or not yet configured
    return event;
  }

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
    // WARN: This will cause memory leaks if not cleared
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
  const iconPath = path.join(
    __dirname,
    `../../resources/tray/logoTemplate.${isMac !== undefined && !isMac ? "ico" : "png"}`,
  );
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Spotlight",
      click: () => showOrCreateWindow(),
    },
    {
      label: "Spotlight Status",
      enabled: false,
      sublabel: `Running on port ${DEFAULT_PORT}`,
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

  tray.setToolTip("Spotlight is running");
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
});

const MAX_RETRIES = 3;
const RECHECK_DELAY = 5000;
const RETRY_DELAY_INCREMENT = 2000;

async function makeSureSpotlightIsRunning() {
  let retries = 0;
  let subscriber: NodeJS.Timeout | null = null;

  async function handler() {
    try {
      await setupSpotlight({
        port: DEFAULT_PORT,
        incomingPayload: storeIncomingPayload,
        isStandalone: true,
      });

      retries = 0;
    } catch (error) {
      console.error(error);
      retries++;

      if (retries >= MAX_RETRIES) {
        Sentry.captureException(error);

        dialog.showErrorBox(
          "Spotlight",
          `Unable to start Spotlight server. This could happen due to a port (${DEFAULT_PORT}) conflict or the server being blocked by a firewall. Try checking your firewall settings and restart the app.`,
        );
      }
    }

    if (subscriber) {
      clearTimeout(subscriber);
      subscriber = null;
    }

    if (retries >= MAX_RETRIES) {
      return;
    }

    subscriber = setTimeout(handler, RECHECK_DELAY + retries * RETRY_DELAY_INCREMENT);
    subscriber.unref();
  }

  handler();
}

makeSureSpotlightIsRunning();
