import * as Sentry from '@sentry/electron/main';
import { clearBuffer, setupSidecar } from '@spotlightjs/sidecar';
import { BrowserWindow, Menu, app, shell } from 'electron';
import path from 'path';

Sentry.init({
  dsn: 'https://192df1a78878de014eb416a99ff70269@o1.ingest.sentry.io/4506400311934976',
  tracesSampleRate: 1.0,
});

let alwaysOnTop = false;

const createWindow = () => {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Spotlight',
    // frame: false,
    // resizable: false,
    // maximizable: false,
    // transparent: true,
    // webPreferences: { nodeIntegration: true },
    titleBarStyle: 'hidden',
    // titleBarOverlay: {
    //   color: '#2f3241',
    //   symbolColor: '#74b1be',
    //   height: 60,
    // },
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
    backgroundColor: '#1e1b4b',
  });

  // win.webContents.openDevTools();

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.once('ready-to-show', function () {
    win.show();
    win.focus();
  });

  win.webContents.on('did-start-loading', () => {
    clearBuffer();
  });

  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(
      `document.querySelector('#sentry-spotlight-root').shadowRoot.querySelector('.spotlight-fullscreen > :first-child').style.cssText = 'padding-top: 34px; -webkit-user-select: none; -webkit-app-region:drag;'`,
    );
  });
};

app.on('window-all-closed', () => {
  app.quit();
});

const isMac = process.platform === 'darwin';

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [
        {
          label: 'Spotlight',
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
      ]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
            },
          ]
        : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
    ],
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      {
        role: 'alwaysontop',
        label: 'Always on Top',
        type: 'checkbox',
        click: () => {
          alwaysOnTop = !alwaysOnTop;
          BrowserWindow.getFocusedWindow()?.setAlwaysOnTop(alwaysOnTop, 'floating');
        },
        checked: alwaysOnTop,
      },
      ...(isMac
        ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
        : [{ role: 'close' }]),
    ],
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          await shell.openExternal('https://spotlightjs.com');
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  setupSidecar();
});
