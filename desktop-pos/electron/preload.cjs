const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('remontadaDesktop', {
  platform: process.platform,
  appName: 'REMONTADA POS',
  init: () => ipcRenderer.invoke('pos:init'),
  authorize: () => ipcRenderer.invoke('pos:authorize'),
  logout: () => ipcRenderer.invoke('pos:logout'),
  replaceCatalog: (data) => ipcRenderer.invoke('pos:replace-catalog', data),
  createSale: (payload) => ipcRenderer.invoke('pos:create-sale', payload),
  addStock: (payload) => ipcRenderer.invoke('pos:add-stock', payload),
  pending: () => ipcRenderer.invoke('pos:pending'),
  markSynced: (id) => ipcRenderer.invoke('pos:mark-synced', id),
  syncError: (data) => ipcRenderer.invoke('pos:sync-error', data)
});