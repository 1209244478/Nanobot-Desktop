const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('=== Test Electron Starting ===');

function createWindow() {
  console.log('Creating test window...');
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载一个简单的 HTML
  win.loadURL('data:text/html,<h1>Hello Electron!</h1><p>If you see this, Electron is working!</p>');
  
  console.log('Test window created');
}

app.whenReady().then(() => {
  console.log('App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
