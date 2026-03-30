# 桌面应用构建故障排除

## 网络问题解决方案

### 问题：无法下载Electron二进制文件
```
Get "https://github.com/electron/electron/releases/download/v41.0.3/electron-v41.0.3-win32-x64.zip": read tcp ...: wsarecv: A connection attempt failed...
```

### 解决方案

#### 方案1：使用国内镜像源

设置Electron镜像环境变量：

**Windows (PowerShell):**
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_CUSTOM_DIR="{{ version }}"
npm run electron:build:win
```

**Windows (CMD):**
```cmd
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_CUSTOM_DIR={{ version }}
npm run electron:build:win
```

**Linux/Mac:**
```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_CUSTOM_DIR="{{ version }}"
npm run electron:build:win
```

#### 方案2：手动下载Electron二进制文件

1. 从镜像站下载Electron二进制文件：
   - https://npmmirror.com/mirrors/electron/
   - 或者：https://registry.npmmirror.com/-/binary/electron/

2. 下载对应版本的文件：
   - Windows: `electron-v41.0.3-win32-x64.zip`
   - macOS: `electron-v41.0.3-darwin-x64.zip`
   - macOS ARM64: `electron-v41.0.3-darwin-arm64.zip`
   - Linux: `electron-v41.0.3-linux-x64.zip`

3. 将下载的文件放到Electron缓存目录：
   - Windows: `%LOCALAPPDATA%\electron\Cache`
   - macOS: `~/Library/Caches/electron/`
   - Linux: `~/.cache/electron/`

#### 方案3：使用代理

如果你有代理服务器，可以设置：

```bash
# 设置HTTP代理
set HTTP_PROXY=http://your-proxy:port
set HTTPS_PROXY=http://your-proxy:port

# 或者使用npm配置
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port
```

#### 方案4：使用预构建的Electron

1. 安装electron-prebuilt-compile：
```bash
npm install --save-dev electron-prebuilt-compile
```

2. 修改package.json中的electron依赖：
```json
{
  "devDependencies": {
    "electron-prebuilt-compile": "^41.0.3"
  }
}
```

## 其他常见问题

### 问题：缺少图标文件

**错误信息：**
```
icon: "build/icon.ico" - file not found
```

**解决方案：**

1. 创建临时图标文件（用于测试）：
```bash
# 创建build目录
mkdir build

# 下载或创建一个简单的图标文件
# 可以使用在线工具创建图标：https://www.favicon-generator.org/
```

2. 或者修改package.json，移除图标配置（用于测试）：
```json
{
  "build": {
    "win": {
      "target": [{"target": "nsis", "arch": ["x64"]}]
      // 移除 "icon": "build/icon.ico"
    }
  }
}
```

### 问题：TypeScript编译错误

**错误信息：**
```
error TS6133: 'event' is declared but its value is never read.
```

**解决方案：**

1. 修复TypeScript错误，在electron/main.ts中：
```typescript
// 将
app.on('web-contents-created', (event, contents) => {

// 改为
app.on('web-contents-created', (_, contents) => {
```

2. 或者禁用严格的未使用变量检查：
```json
{
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### 问题：缺少package.json中的元数据

**错误信息：**
```
description is missed in package.json
author is missed in package.json
```

**解决方案：**

在package.json中添加缺失的字段：
```json
{
  "name": "nanobot-desktop",
  "version": "0.1.0",
  "description": "Nanobot Desktop Application",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT"
}
```

## 构建成功后的测试

### Windows
1. 运行安装程序：`dist-electron/Nanobot Desktop Setup 0.1.0.exe`
2. 或者直接运行解压后的exe：`dist-electron/win-unpacked/Nanobot Desktop.exe`

### macOS
1. 打开DMG文件：`dist-electron/Nanobot Desktop-0.1.0.dmg`
2. 将应用拖到Applications文件夹
3. 从Applications文件夹启动应用

### Linux
1. 运行AppImage：`dist-electron/Nanobot Desktop-0.1.0.AppImage`
2. 或者安装deb包：`sudo dpkg -i dist-electron/nanobot-desktop_0.1.0_amd64.deb`

## 开发模式测试

### 启动开发模式
```bash
npm run electron:dev
```

这将：
1. 启动Vite开发服务器（http://localhost:5173）
2. 等待服务器启动
3. 启动Electron应用

### 调试技巧

1. **查看开发者工具**：在应用中按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (macOS)

2. **查看主进程日志**：在终端中查看Electron的输出

3. **重新加载应用**：在开发者工具中按 `Ctrl+R` (Windows/Linux) 或 `Cmd+R` (macOS)

4. **清除缓存**：
```bash
# 清除Electron缓存
rm -rf ~/.cache/electron/  # Linux
rm -rf ~/Library/Caches/electron/  # macOS
rm -rf %LOCALAPPDATA%\electron\Cache  # Windows
```

## 性能优化

### 减小应用体积

1. **使用asar压缩**：
```json
{
  "build": {
    "asar": true,
    "asarUnpack": [
      "node_modules/**/*"
    ]
  }
}
```

2. **排除不必要的文件**：
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "extraFiles": [
      {
        "from": "README.md",
        "to": "README.md"
      }
    ]
  }
}
```

3. **使用生产构建**：
```bash
npm run build  # 确保使用生产构建
```

## 发布准备

### 代码签名

**Windows:**
```bash
# 需要购买代码签名证书
npm run electron:build:win -- --win --x64 --sign
```

**macOS:**
```bash
# 需要Apple开发者账号
npm run electron:build:mac -- --mac --x64 --arm64 --sign
```

### 自动更新

可以使用electron-updater实现自动更新功能：

```bash
npm install electron-updater
```

在main.ts中添加更新逻辑：
```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();
```

## 获取帮助

如果遇到其他问题，可以：

1. 查看Electron官方文档：https://www.electronjs.org/docs
2. 查看Electron Builder文档：https://www.electron.build/
3. 在GitHub上搜索相关问题
4. 查看项目的Issues页面
