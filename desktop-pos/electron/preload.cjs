const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('remontadaDesktop', {
  platform: process.platform,
  appName: 'REMONTADA POS'
});