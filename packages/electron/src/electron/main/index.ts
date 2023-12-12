import { setupSidecar } from '@spotlightjs/sidecar';
import { attachTitlebarToWindow, setupTitlebar } from 'custom-electron-titlebar/main';
import { BrowserWindow, app } from 'electron';
import path from 'path';

setupTitlebar();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    // frame: false,
    // resizable: false,
    // maximizable: false,
    // transparent: true,
    // webPreferences: { nodeIntegration: true },
    title: 'Spotlight',
    titleBarStyle: 'hidden',
    /* You can use *titleBarOverlay: true* to use the original Windows controls */
    titleBarOverlay: true,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });
  attachTitlebarToWindow(win);

  win.loadFile('index.html');

  // win.webContents.openDevTools();

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    win.loadFile(path.join(__dirname, '../../index.html'));
  }
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  setupSidecar();
});
