import { setupSidecar } from '@spotlightjs/sidecar';
import { BrowserWindow, app } from 'electron';
import path from 'path';

// setupTitlebar();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 850,
    height: 600,
    minWidth: 850,
    minHeight: 500,
    show: false,
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
};

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  setupSidecar();
});
