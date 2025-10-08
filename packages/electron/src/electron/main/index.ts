import path from "node:path";
import * as Sentry from "@sentry/electron/main";
import { clearBuffer, setupSidecar } from "@spotlightjs/sidecar";
import { BrowserWindow, Menu, Tray, app, dialog, ipcMain, nativeImage, shell } from "electron";
import Store from "electron-store";
import { autoUpdater } from "electron-updater";

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
    Sentry.captureException(error);
  }

  isCheckingForUpdates = false;
  checkingForUpdatesTimeout = setTimeout(checkForUpdates, ONE_HOUR);
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

  autoUpdater.on("error", error => Sentry.captureException(error));
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
    /**
     * Need to create these elements here as Spotlight.init() function
     * replaces the body content with the app root. This runs after the app
     * is loaded.
     *
     * We need the error-screen to be in the tree to show when an error occurs.
     */
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
       }
         
       // Creating the error component
       const errorScreen = document.createElement('div');
       errorScreen.id = 'error-screen';
       errorScreen.style.display = 'none';
       errorScreen.innerHTML = \`
        <div class="error-page-navbar">
        <img alt="spotlight-icon" src="./resources/sized.png" width="50" height="50" />
        <p class="spotlight-title">Spotlight</p>
      </div>
      <h1 class="error header">Oops! An error occurred.</h1>
      <p class="error description">Press Cmd + R to reload the app.</p>
       \`;
       document.body.appendChild(errorScreen);`,
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

Promise.all([
  setupSidecar({
    port: 8969,
    incomingPayload: storeIncomingPayload,
    isStandalone: true,
  }),
  app.whenReady(),
]).then(() => {
  if (!isLinux) {
    createTray();
  }

  createWindow();
  app.on("activate", () => {
    showOrCreateWindow();
  });

  ipcMain.on("set-badge-count", handleBadgeCount);
});

const MAX_RETRIES = 5;
const RECHECK_DELAY = 5000;
const RETRY_DELAY_INCREMENT = 2000;

async function makeSureSidecarIsRunning() {
  let retries = 0;
  let subscriber: NodeJS.Timeout | null = null;

  async function handler() {
    try {
      /**
       * Checking if the sidecar is running
       * And if not, starting it up
       */
      await setupSidecar({
        port: 8969,
        incomingPayload: storeIncomingPayload,
        isStandalone: true,
      });
      retries = 0;
    } catch (error) {
      console.error(error);
      retries++;

      if (retries > MAX_RETRIES) {
        Sentry.captureException(error);

        // Notifying the user that the sidecar is not running
        dialog.showErrorBox(
          "Spotlight",
          "Unable to start Spotlight server. This could happen due to a port (8969) conflict or the server being blocked by a firewall. Try checking your firewall settings and restart the app.",
        );
      }
    }

    if (subscriber) {
      clearTimeout(subscriber);
      subscriber = null;
    }

    if (retries > MAX_RETRIES) {
      return;
    }

    subscriber = setTimeout(handler, RECHECK_DELAY + retries * RETRY_DELAY_INCREMENT);
  }

  handler();
}

makeSureSidecarIsRunning();
