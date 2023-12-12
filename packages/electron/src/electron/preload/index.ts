import { Titlebar, TitlebarColor } from 'custom-electron-titlebar';
import path from 'path';

window.addEventListener('DOMContentLoaded', () => {
  // Title bar implementation
  new Titlebar({
    backgroundColor: TitlebarColor.fromHex('#1e1b4b'),
    icon: path.resolve('resources/icons', 'favicon.svg'),
    // icons: path.resolve('example/assets', 'icons.json'),
  });
});
