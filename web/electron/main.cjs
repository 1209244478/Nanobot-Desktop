const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

console.log('=== Electron Main Process Starting ===');

let mainWindow = null;
let backendProcess = null;
let backendReady = false;
const BACKEND_PORT = 18790;

const DEFAULT_CONFIG = {
  "agents": {
    "defaults": {
      "workspace": "~/.nanobot/workspace",
      "model": "anthropic/claude-opus-4-5",
      "provider": "auto",
      "maxTokens": 8192,
      "contextWindowTokens": 65536,
      "temperature": 0.1,
      "maxToolIterations": 40,
      "reasoningEffort": null
    }
  },
  "channels": {
    "sendProgress": true,
    "sendToolHints": false,
    "dingtalk": {
      "enabled": false,
      "clientId": "",
      "clientSecret": "",
      "allowFrom": ["*"]
    },
    "discord": {
      "enabled": false,
      "token": "",
      "allowFrom": ["*"],
      "gatewayUrl": "wss://gateway.discord.gg/?v=10&encoding=json",
      "intents": 37377,
      "groupPolicy": "mention"
    },
    "email": {
      "enabled": false,
      "consentGranted": false,
      "imapHost": "",
      "imapPort": 993,
      "imapUsername": "",
      "imapPassword": "",
      "imapMailbox": "INBOX",
      "imapUseSsl": true,
      "smtpHost": "",
      "smtpPort": 587,
      "smtpUsername": "",
      "smtpPassword": "",
      "smtpUseTls": true,
      "smtpUseSsl": false,
      "fromAddress": "",
      "autoReplyEnabled": true,
      "pollIntervalSeconds": 30,
      "markSeen": true,
      "maxBodyChars": 12000,
      "subjectPrefix": "Re: ",
      "allowFrom": ["*"]
    },
    "feishu": {
      "enabled": false,
      "appId": "",
      "appSecret": "",
      "encryptKey": "",
      "verificationToken": "",
      "allowFrom": ["*"],
      "reactEmoji": "THUMBSUP",
      "groupPolicy": "mention",
      "replyToMessage": false
    },
    "mochat": {
      "enabled": false,
      "baseUrl": "https://mochat.io",
      "socketUrl": "",
      "socketPath": "/socket.io",
      "socketDisableMsgpack": false,
      "socketReconnectDelayMs": 1000,
      "socketMaxReconnectDelayMs": 10000,
      "socketConnectTimeoutMs": 10000,
      "refreshIntervalMs": 30000,
      "watchTimeoutMs": 25000,
      "watchLimit": 100,
      "retryDelayMs": 500,
      "maxRetryAttempts": 0,
      "clawToken": "",
      "agentUserId": "",
      "sessions": [],
      "panels": [],
      "allowFrom": ["*"],
      "mention": {
        "requireInGroups": false
      },
      "groups": {},
      "replyDelayMode": "non-mention",
      "replyDelayMs": 120000
    },
    "qq": {
      "enabled": false,
      "appId": "",
      "secret": "",
      "allowFrom": ["*"],
      "msgFormat": "plain"
    },
    "slack": {
      "enabled": false,
      "mode": "socket",
      "webhookPath": "/slack/events",
      "botToken": "",
      "appToken": "",
      "userTokenReadOnly": true,
      "replyInThread": true,
      "reactEmoji": "eyes",
      "doneEmoji": "white_check_mark",
      "allowFrom": ["*"],
      "groupPolicy": "mention",
      "groupAllowFrom": ["*"],
      "dm": {
        "enabled": true,
        "policy": "open",
        "allowFrom": ["*"]
      }
    },
    "telegram": {
      "enabled": false,
      "token": "",
      "allowFrom": ["*"],
      "proxy": null,
      "replyToMessage": false,
      "groupPolicy": "mention",
      "connectionPoolSize": 32,
      "poolTimeout": 5.0
    },
    "wecom": {
      "enabled": false,
      "botId": "",
      "secret": "",
      "allowFrom": ["*"],
      "welcomeMessage": ""
    },
    "whatsapp": {
      "enabled": false,
      "bridgeUrl": "ws://localhost:3001",
      "bridgeToken": "",
      "allowFrom": ["*"]
    }
  },
  "providers": {
    "custom": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "azureOpenai": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "anthropic": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "openai": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "openrouter": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "deepseek": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "groq": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "zhipu": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "dashscope": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "vllm": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "ollama": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "gemini": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "moonshot": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "xiaomi": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "minimax": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "aihubmix": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "siliconflow": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "volcengine": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "volcengineCodingPlan": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "byteplus": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "byteplusCodingPlan": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "openaiCodex": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    },
    "githubCopilot": {
      "apiKey": "",
      "apiBase": null,
      "extraHeaders": null
    }
  },
  "gateway": {
    "host": "0.0.0.0",
    "port": BACKEND_PORT,
    "heartbeat": {
      "enabled": true,
      "intervalS": 1800
    }
  },
  "tools": {
    "web": {
      "proxy": null,
      "search": {
        "provider": "brave",
        "apiKey": "",
        "baseUrl": "",
        "maxResults": 5
      }
    },
    "exec": {
      "timeout": 60,
      "pathAppend": ""
    },
    "restrictToWorkspace": false,
    "mcpServers": {}
  }
};

function getBackendPath() {
  if (app.isPackaged) {
    const backendName = process.platform === 'win32' ? 'nanobot.exe' : 'nanobot';
    return path.join(process.resourcesPath, 'backend', backendName);
  }
  const backendName = process.platform === 'win32' ? 'nanobot.exe' : 'nanobot';
  return path.join(__dirname, '..', '..', 'dist', backendName);
}

function getConfigDir() {
  return path.join(process.env.USERPROFILE || process.env.HOME, '.nanobot');
}

function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

function getWorkspacePath() {
  return path.join(getConfigDir(), 'workspace');
}

function isConfigExists() {
  const configPath = getConfigPath();
  console.log('Checking config at:', configPath);
  return fs.existsSync(configPath);
}

function createDefaultConfig() {
  const configDir = getConfigDir();
  const configPath = getConfigPath();
  const workspacePath = getWorkspacePath();
  
  console.log('Creating default config at:', configPath);
  
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log('Created config directory:', configDir);
    }
    
    if (!fs.existsSync(configPath)) {
      const config = { ...DEFAULT_CONFIG };
      config.agents.defaults.workspace = workspacePath.replace(/\\/g, '/');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('Created default config file');
    }
    
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
      console.log('Created workspace directory:', workspacePath);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to create default config:', error);
    dialog.showErrorBox('Config Error', `Failed to create config: ${error.message}`);
    return false;
  }
}

function checkBackendReady(maxAttempts = 30, interval = 1000) {
  return new Promise((resolve) => {
    const http = require('http');
    let attempts = 0;
    
    function check() {
      attempts++;
      console.log(`Checking backend ready (attempt ${attempts}/${maxAttempts})...`);
      
      const req = http.request({
        hostname: '127.0.0.1',
        port: BACKEND_PORT,
        path: '/api/status',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        if (res.statusCode === 200) {
          console.log('Backend is ready!');
          backendReady = true;
          resolve(true);
        } else {
          console.log('Backend responded with status:', res.statusCode);
          if (attempts < maxAttempts) {
            setTimeout(check, interval);
          } else {
            resolve(false);
          }
        }
      });
      
      req.on('error', (err) => {
        console.log('Backend not ready yet:', err.message);
        if (attempts < maxAttempts) {
          setTimeout(check, interval);
        } else {
          resolve(false);
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(check, interval);
        } else {
          resolve(false);
        }
      });
      
      req.end();
    }
    
    check();
  });
}

function startBackend() {
  const backendPath = getBackendPath();
  console.log('Backend path:', backendPath);
  
  if (!fs.existsSync(backendPath)) {
    console.error('Backend not found at:', backendPath);
    dialog.showErrorBox('Backend Error', `Backend executable not found at: ${backendPath}`);
    return false;
  }

  const args = ['gateway', '--port', String(BACKEND_PORT)];
  
  console.log('Starting backend with args:', args);
  console.log('Working directory:', process.cwd());
  
  backendProcess = spawn(backendPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env }
  });

  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[Backend stdout]:', output);
  });

  backendProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.error('[Backend stderr]:', output);
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
    dialog.showErrorBox('Backend Error', `Failed to start backend: ${err.message}`);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log('Backend exited with code:', code, 'signal:', signal);
    backendProcess = null;
    backendReady = false;
  });

  console.log('Backend process started, PID:', backendProcess.pid);
  return true;
}

function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend process, PID:', backendProcess.pid);
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'win32') {
        try {
          execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { timeout: 5000 });
          console.log('Backend process killed via taskkill');
        } catch (e) {
          console.log('taskkill failed, trying kill():', e.message);
          backendProcess.kill('SIGKILL');
        }
      } else {
        backendProcess.kill('SIGTERM');
        setTimeout(() => {
          if (backendProcess) {
            backendProcess.kill('SIGKILL');
          }
        }, 3000);
      }
    } catch (e) {
      console.error('Error stopping backend:', e);
    }
    backendProcess = null;
    backendReady = false;
  }
}

function createWindow() {
  console.log('=== Creating Window ===');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    backgroundColor: '#1a1a1a',
    show: true,
    center: true,
  });

  console.log('Window created, ID:', mainWindow.id);

  const distPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log('Loading file:', distPath);
  
  mainWindow.loadFile(distPath).then(() => {
    console.log('File loaded successfully!');
  }).catch(err => {
    console.error('Failed to load:', err);
  });
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('console-message', (_event, _level, message, _line, _sourceId) => {
    console.log('[Renderer]', message);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
}

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

ipcMain.handle('get-backend-port', () => {
  return BACKEND_PORT;
});

ipcMain.handle('is-config-exists', () => {
  return isConfigExists();
});

ipcMain.handle('is-backend-ready', () => {
  return backendReady;
});

app.whenReady().then(async () => {
  console.log('App is ready');
  
  const configExists = isConfigExists();
  console.log('Config exists:', configExists);
  
  if (!configExists) {
    console.log('First run - creating default config...');
    createDefaultConfig();
  }
  
  createWindow();
  
  const backendStarted = startBackend();
  
  if (backendStarted) {
    console.log('Waiting for backend to be ready...');
    checkBackendReady(60, 1000).then(ready => {
      if (ready) {
        console.log('Backend is ready');
        backendReady = true;
        if (mainWindow) {
          mainWindow.webContents.send('backend-ready');
        }
      } else {
        console.error('Backend failed to start within timeout');
        if (mainWindow) {
          mainWindow.webContents.send('backend-error', 'Backend failed to start within timeout');
        }
      }
    });
  } else {
    console.error('Failed to start backend process');
    if (mainWindow) {
      mainWindow.webContents.send('backend-error', 'Failed to start backend process');
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    stopBackend();
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('App is quitting, stopping backend...');
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

console.log('=== Electron Main Process Setup Complete ===');
