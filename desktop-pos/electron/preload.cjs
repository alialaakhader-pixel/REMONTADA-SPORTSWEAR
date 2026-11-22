const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('remontadaDesktop', {
  platform: process.platform,
  appName: 'REMONTADA POS',
  init: () => ipcRenderer.invoke('pos:init'),
  authorize: () => ipcRenderer.invoke('pos:authorize'),
  saveOfflineCredentials: (data) => ipcRenderer.invoke('pos:save-offline-credentials', data),
  offlineInfo: () => ipcRenderer.invoke('pos:offline-info'),
  verifyOfflinePassword: (password) => ipcRenderer.invoke('pos:verify-offline-password', password),
  logout: () => ipcRenderer.invoke('pos:logout'),
  replaceCatalog: (data) => ipcRenderer.invoke('pos:replace-catalog', data),
  createSale: (payload) => ipcRenderer.invoke('pos:create-sale', payload),
  addStock: (payload) => ipcRenderer.invoke('pos:add-stock', payload),
  saveProduct: (payload) => ipcRenderer.invoke('pos:save-product', payload),
  adjustStock: (payload) => ipcRenderer.invoke('pos:adjust-stock', payload),
  returnSaleItem: (payload) => ipcRenderer.invoke('pos:return-sale-item', payload),
  addExpense: (payload) => ipcRenderer.invoke('pos:add-expense', payload),
  pending: () => ipcRenderer.invoke('pos:pending'),
  markSynced: (id) => ipcRenderer.invoke('pos:mark-synced', id),
  syncError: (data) => ipcRenderer.invoke('pos:sync-error', data)
});