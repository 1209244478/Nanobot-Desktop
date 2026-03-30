const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('=== Simple Test Starting ===');
console.log('Platform:', process.platform);
console.log('App path:', app.getAppPath());

let mainWindow = null;

function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  console.log('Window created');

  // 加载打包后的文件
  const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log('Loading:', distPath);
  
  mainWindow.loadFile(distPath).then(() => {
    console.log('File loaded!');
  }).catch(err => {
    console.error('Load error:', err);
  });

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  console.log('App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
