import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

console.log('=== Electron Main Process Starting ===');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  console.log('=== Creating Window ===');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // 使用默认窗口样式
    backgroundColor: '#1a1a1a',
    show: true,
    // 确保窗口在屏幕中央
    center: true,
  });

  console.log('Window created, ID:', mainWindow.id);

  // 生产环境加载打包后的文件
  const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log('Loading file:', distPath);
  
  mainWindow.loadFile(distPath).then(() => {
    console.log('File loaded successfully!');
  }).catch(err => {
    console.error('Failed to load file:', err);
  });
  
  // 打开开发者工具
  mainWindow.webContents.openDevTools();

  // 处理控制台消息
  mainWindow.webContents.on('console-message', (_event, _level, message, _line, _sourceId) => {
    console.log('[Renderer]', message);
  });

  // 处理加载错误
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
}

// IPC处理程序
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('app-quit', () => {
  app.quit();
});

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('=== Electron Main Process Setup Complete ===');
