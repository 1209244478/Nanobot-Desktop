import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    versions: process.versions,
    getVersions: () => process.versions,
    // 窗口控制
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),
    // 应用控制
    quitApp: () => ipcRenderer.invoke('app-quit'),
});
