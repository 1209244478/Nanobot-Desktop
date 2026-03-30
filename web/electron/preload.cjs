const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  getVersions: () => process.versions,
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  quitApp: () => ipcRenderer.invoke('app-quit'),
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  isBackendReady: () => ipcRenderer.invoke('is-backend-ready'),
  onBackendReady: (callback) => {
    ipcRenderer.on('backend-ready', callback);
    return () => ipcRenderer.removeListener('backend-ready', callback);
  },
  onBackendError: (callback) => {
    ipcRenderer.on('backend-error', (_event, error) => callback(error));
    return () => ipcRenderer.removeListener('backend-error', callback);
  },
});
