import fs from "node:fs";
import path from "node:path";
import * as Sentry from "@sentry/electron/main";
import { clearBuffer, setupSidecar } from "@spotlightjs/sidecar";
import { BrowserWindow, Menu, Tray, app, dialog, ipcMain, nativeImage, shell } from "electron";
import { autoUpdater as nativeUpdater } from "electron";
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

    nativeUpdater.once("before-quit-for-update", () => {
      app.exit();
    });
  }

  autoUpdater.quitAndInstall();
}

async function checkForUpdates() {
  const menuItem = isMac ? { ...template[0].submenu?.[1] } : undefined;

  try {
    const updateInfo = await autoUpdater.checkForUpdates();

    const isUpdateAvailable = updateInfo?.isUpdateAvailable;

    if (isUpdateAvailable) {
      if (menuItem) {
        menuItem.label = "Restart to Update";
        menuItem.click = () => {
          installAndRestart();
        };
      }
    } else {
      if (menuItem) {
        menuItem.label = "Check for Updates";
        menuItem.click = () => {
          checkForUpdates();
        };
      }
    }
  } catch (error) {
    console.error(error, error.stack);
    Sentry.captureException(error);
  }

  if (menuItem) {
    const _template = [...template];
    if (_template[0].submenu?.[1].id === "check-for-updates") _template[0].submenu[1] = menuItem;
    Menu.setApplicationMenu(Menu.buildFromTemplate(_template));
  }
  setTimeout(checkForUpdates, ONE_HOUR);
}

app.on("ready", () => {
  checkForUpdates();

  autoUpdater.on("update-downloaded", async () => {
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
    console.error(error);
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
let win: BrowserWindow;
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

  win.webContents.on("did-start-loading", () => {
    clearBuffer();
    app.setBadgeCount(0);
  });

  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript(
      `const firstChild = document.querySelector('#sentry-spotlight-root')?.shadowRoot?.querySelector('.spotlight-fullscreen > :first-child');
        if(firstChild) {
          firstChild.style.cssText = 'padding-top: 34px; -webkit-app-region:drag;'
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
      const sentryRoot = document.getElementById('sentry-spotlight-root');
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
  if (!win) {
    createWindow();
  } else {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
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
