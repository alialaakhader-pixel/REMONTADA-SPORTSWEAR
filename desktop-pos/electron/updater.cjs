const { app, ipcMain, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

function publish(status) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('app:update-status', status);
  }
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;
autoUpdater.on('checking-for-update', () => publish({ state: 'checking', message: 'جارٍ فحص تحديثات البرنامج...' }));
autoUpdater.on('update-available', info => publish({ state: 'available', version: info.version, message: 'يوجد تحديث؛ جارٍ تنزيله في الخلفية.' }));
autoUpdater.on('download-progress', p => publish({ state: 'downloading', percent: Math.round(p.percent), message: 'جارٍ تنزيل التحديث...' }));
autoUpdater.on('update-downloaded', info => publish({ state: 'downloaded', version: info.version, message: 'التحديث جاهز. أعد تشغيل البرنامج لتثبيته.' }));
autoUpdater.on('update-not-available', () => publish({ state: 'current', message: 'البرنامج محدث إلى آخر إصدار.' }));
autoUpdater.on('error', err => publish({ state: 'error', message: 'تعذر فحص التحديثات: ' + String(err?.message || err).slice(0, 180) }));

ipcMain.handle('app:check-for-updates', async () => {
  if (!app.isPackaged || process.platform !== 'win32') return { state: 'unsupported', message: 'التحديث التلقائي متاح لنسخة Windows المثبتة.' };
  try { await autoUpdater.checkForUpdates(); return { state: 'checking', message: 'جارٍ فحص التحديثات...' }; }
  catch (err) { return { state: 'error', message: String(err?.message || err) }; }
});
ipcMain.handle('app:install-update', () => {
  if (app.isPackaged && process.platform === 'win32') autoUpdater.quitAndInstall();
  return true;
});

app.whenReady().then(() => {
  if (app.isPackaged && process.platform === 'win32') {
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000);
  }
});
