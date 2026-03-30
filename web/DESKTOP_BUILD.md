# Nanobot 桌面应用构建指南

这个指南说明如何将网页应用构建为Windows和Mac桌面应用。

## 前置要求

- Node.js 18+ 
- npm 或 yarn
- Git

## 开发模式

### 启动开发服务器
```bash
cd web
npm run dev
```

### 启动Electron开发模式
```bash
cd web
npm run electron:dev
```

这将同时启动Vite开发服务器和Electron应用。

## 构建桌面应用

### 构建所有平台
```bash
cd web
npm run electron:build
```

### 仅构建Windows版本
```bash
cd web
npm run electron:build:win
```

### 仅构建Mac版本
```bash
cd web
npm run electron:build:mac
```

### 仅构建Linux版本
```bash
cd web
npm run electron:build:linux
```

## 构建输出

构建后的文件将输出到 `dist-electron` 目录：

- Windows: `.exe` 安装程序
- macOS: `.dmg` 和 `.zip` 文件
- Linux: `.AppImage` 和 `.deb` 文件

## 项目结构

```
web/
├── electron/              # Electron主进程和预加载脚本
│   ├── main.ts          # Electron主进程
│   └── preload.ts       # 预加载脚本
├── src/                # React应用源代码
│   └── components/
│       ├── Layout.tsx      # 网页布局
│       └── DesktopLayout.tsx # 桌面布局（带窗口控制）
├── dist/               # 构建的网页文件
├── dist-electron/       # 构建的桌面应用
├── build/              # 构建资源（图标等）
└── package.json         # 项目配置
```

## 功能特性

### 桌面应用特性
- 窗口控制（最小化、最大化、关闭）
- 自定义标题栏
- 系统托盘支持
- 自动更新支持（可扩展）
- 跨平台支持（Windows、macOS、Linux）

### 网页应用特性
- 响应式设计
- 现代化UI
- 完整的功能支持
- WebSocket连接
- 国际化支持

## 配置说明

### Electron配置
- 应用ID: `com.nanobot.desktop`
- 产品名称: `Nanobot Desktop`
- 默认窗口大小: 1200x800
- 最小窗口大小: 800x600

### 开发服务器
- Vite开发服务器: `http://localhost:5173`
- 热重载支持
- 开发者工具支持

## 故障排除

### 构建失败
1. 清理node_modules和重新安装依赖
   ```bash
   rm -rf node_modules
   npm install
   ```

2. 检查TypeScript编译错误
   ```bash
   npm run build
   ```

3. 检查Electron构建日志
   ```bash
   npm run electron:build -- --verbose
   ```

### 运行时错误
1. 检查控制台输出
2. 查看开发者工具中的错误
3. 确认所有依赖已正确安装

## 发布准备

### Windows
- 准备icon.ico图标文件
- 配置NSIS安装程序选项
- 测试安装程序

### macOS
- 准备icon.icns图标文件
- 配置DMG选项
- 代码签名（可选）

### Linux
- 准备icon.png图标文件
- 测试AppImage和deb包

## 许可证

请确保在构建配置中包含正确的许可证信息。

## 支持

如有问题，请查看：
- Electron文档: https://www.electronjs.org/docs
- Electron Builder文档: https://www.electron.build/
- Vite文档: https://vitejs.dev/
