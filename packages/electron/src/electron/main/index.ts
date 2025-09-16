import path from "node:path";
import * as Sentry from "@sentry/electron/main";
import { clearBuffer, setupSidecar } from "@spotlightjs/sidecar";
import { BrowserWindow, Menu, app, dialog, ipcMain, shell } from "electron";
import { autoUpdater as nativeUpdater } from "electron";
import Store from "electron-store";
import { type UpdateCheckResult, autoUpdater } from "electron-updater";

const store = new Store();

autoUpdater.forceDevUpdateConfig = process.env.NODE_ENV === "development";

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

const ONE_HOUR = 60 * 60 * 1000;

app.on("ready", () => {
  let updateInfo: UpdateCheckResult | null = null;

  async function checkForUpdates() {
    try {
      updateInfo = await autoUpdater.checkForUpdates();

      if (!updateInfo?.isUpdateAvailable) {
        setTimeout(checkForUpdates, ONE_HOUR);
      }
    } catch (error) {
      console.error(error);
    }
  }

  checkForUpdates();

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "question",
        message: "A new update has been downloaded. It will be installed on restart.",
        buttons: ["Restart", "Later"],
      })
      .then(result => {
        if (result.response === 0) {
          installAndRestart();
        }
      });
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

app.on("window-all-closed", () => {
  app.quit();
});

const isMac = process.platform === "darwin";

const template: Electron.MenuItemConstructorOptions[] = [
  // { role: 'appMenu' }
  ...((isMac
    ? [
        {
          label: "Spotlight",
          role: "appMenu",
          submenu: [
            { role: "about" },
            { label: "Check for Updates", click: () => autoUpdater.checkForUpdates() },
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
    win.webContents.executeJavaScript(`
      const sentryRoot = document.getElementById('sentry-spotlight-root');
      const errorScreen = document.getElementById('error-screen');
      if(sentryRoot){
        sentryRoot.style.display = 'none';
      }
      if(errorScreen){
        errorScreen.style.display = 'block';
      }
    `);
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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.on("set-badge-count", handleBadgeCount);

  setupSidecar({
    port: 8969,
    incomingPayload: storeIncomingPayload,
    isStandalone: true,
  });
});
