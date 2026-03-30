# 🐈 nanobot 项目 Python 代码功能标注

## 项目概述

nanobot 是一个超轻量级的个人AI助手框架，灵感来自OpenClaw，以99%更少的代码量提供核心代理功能。

- **GitHub**: https://github.com/HKUDS/nanobot
- **版本**: 0.1.4.post5

---

## 📁 核心入口模块

### `__main__.py`
- **功能**: 程序入口点，支持 `python -m nanobot` 方式运行
- **职责**: 导入并启动CLI命令应用

### `__init__.py`
- **功能**: 包初始化，定义版本号和logo
- **版本**: `0.1.4.post5`

---

## 📁 agent/ - 核心代理模块

### `agent/__init__.py`
- **功能**: 导出核心组件 `AgentLoop`, `ContextBuilder`, `MemoryStore`, `SkillsLoader`

### `agent/loop.py` ⭐核心
- **功能**: **代理循环引擎** - nanobot的核心处理引擎
- **职责**:
  - 从消息总线接收消息
  - 构建上下文（历史、记忆、技能）
  - 调用LLM提供商
  - 执行工具调用
  - 发送响应回通道
  - 管理MCP服务器连接
  - 处理子代理任务
  - 提供直接处理接口（`process_direct`）用于CLI/Web

### `agent/context.py`
- **功能**: **上下文构建器**
- **职责**:
  - 构建系统提示词（身份、引导文件、记忆、技能）
  - 处理多模态内容（图片base64编码）
  - 管理运行时上下文注入
  - 构建LLM调用消息列表

### `agent/memory.py`
- **功能**: **双层记忆系统**
- **职责**:
  - `MemoryStore`: 管理长期记忆（MEMORY.md）和历史日志（HISTORY.md）
  - `MemoryConsolidator`: 记忆整合器，将对话压缩为持久记忆
  - 支持token估算和上下文窗口管理

### `agent/skills.py`
- **功能**: **技能加载器**
- **职责**:
  - 发现和加载内置/工作区技能
  - 解析SKILL.md文件的frontmatter元数据
  - 检查技能依赖要求（CLI工具、环境变量）
  - 构建技能摘要供代理渐进式加载

### `agent/subagent.py`
- **功能**: **子代理管理器**
- **职责**:
  - 在后台生成独立的子代理执行任务
  - 子代理拥有独立的工具集（无message/spawn工具）
  - 任务完成后通知原始会话

---

## 📁 agent/tools/ - 工具模块

### `agent/tools/base.py`
- **功能**: **工具抽象基类**
- **职责**:
  - 定义工具接口（name, description, parameters, execute）
  - 提供参数类型转换和JSON Schema验证
  - 生成OpenAI格式的工具定义

### `agent/tools/registry.py`
- **功能**: **工具注册表**
- **职责**:
  - 动态注册和管理工具
  - 执行工具调用并返回结果
  - 提供工具定义列表

### `agent/tools/filesystem.py`
- **功能**: **文件系统工具集**
- **工具**:
  - `ReadFileTool`: 读取文件内容，支持分页
  - `WriteFileTool`: 写入文件
  - `EditFileTool`: 搜索替换编辑文件
  - `ListDirTool`: 列出目录内容
- **安全**: 支持工作区限制和路径验证

### `agent/tools/shell.py`
- **功能**: **Shell命令执行工具**
- **职责**:
  - 执行shell命令并返回输出
  - 危险命令防护（rm -rf, format, fork bomb等）
  - 超时控制和输出截断

### `agent/tools/web.py`
- **功能**: **网络工具集**
- **工具**:
  - `WebSearchTool`: 网页搜索（支持Brave、Tavily、DuckDuckGo、SearXNG、Jina）
  - `WebFetchTool`: 获取网页内容并转换为Markdown
- **安全**: SSRF防护、URL验证

### `agent/tools/message.py`
- **功能**: **消息发送工具**
- **职责**:
  - 向特定聊天通道发送消息
  - 支持媒体附件
  - 管理每轮发送状态

### `agent/tools/spawn.py`
- **功能**: **子代理生成工具**
- **职责**: 创建后台子代理执行独立任务

### `agent/tools/cron.py`
- **功能**: **定时任务工具**
- **操作**: add（添加）、list（列出）、remove（删除）
- **支持**: 一次性任务、间隔任务、cron表达式

### `agent/tools/mcp.py`
- **功能**: **MCP协议客户端**
- **职责**:
  - 连接MCP服务器（stdio/SSE/streamableHttp传输）
  - 将MCP工具包装为nanobot原生工具
  - 支持工具过滤和超时控制

---

## 📁 channels/ - 聊天通道模块

### `channels/base.py`
- **功能**: **通道抽象基类**
- **职责**:
  - 定义通道接口（start, stop, send）
  - 权限检查（allow_from白名单）
  - 音频转录集成
  - 消息转发到总线

### `channels/registry.py`
- **功能**: **通道自动发现注册表**
- **职责**:
  - 扫描内置通道模块
  - 加载外部插件（entry_points）
  - 防止插件覆盖内置通道

### `channels/manager.py` ⭐增强
- **功能**: **通道管理器**
- **职责**:
  - 初始化和启动所有启用的通道
  - 路由出站消息到对应通道
  - 管理通道生命周期
  - **动态启停**: `start_channel()`, `stop_channel()`
  - **热重载**: `reload_channel()` 支持配置更新后动态重载
  - **消息订阅**: 使用发布-订阅模式接收消息
  - 空allowFrom自动默认为允许所有人

### 内置通道实现

| 文件 | 通道 | 协议/SDK |
|------|------|----------|
| `telegram.py` | Telegram | python-telegram-bot |
| `discord.py` | Discord | Gateway WebSocket |
| `slack.py` | Slack | Socket Mode |
| `feishu.py` | 飞书/Lark | lark-oapi SDK |
| `dingtalk.py` | 钉钉 | Stream Mode SDK |
| `wecom.py` | 企业微信 | wecom_aibot_sdk |
| `whatsapp.py` | WhatsApp | Node.js Bridge |
| `email.py` | Email | IMAP/SMTP |
| `qq.py` | QQ | botpy SDK |
| `matrix.py` | Matrix/Element | matrix-nio |
| `mochat.py` | Mochat | Socket.IO |

---

## 📁 providers/ - LLM提供商模块

### `providers/base.py`
- **功能**: **LLM提供商抽象基类**
- **职责**:
  - 定义chat接口
  - 工具调用请求/响应数据结构
  - 消息内容清理和验证
  - 重试机制和瞬态错误检测

### `providers/registry.py`
- **功能**: **提供商元数据注册表**
- **职责**:
  - 定义所有支持的提供商规格
  - 模型名称匹配和提供商检测
  - 环境变量配置
  - 支持网关和本地部署

### `providers/litellm_provider.py` ⭐核心
- **功能**: **LiteLLM统一提供商**
- **职责**:
  - 通过LiteLLM支持多种LLM后端
  - 自动模型前缀处理
  - 网关/本地部署检测
  - 提示词缓存支持

### `providers/azure_openai_provider.py`
- **功能**: **Azure OpenAI提供商**
- **特点**: 直接HTTP调用，API版本2024-10-21，使用api-key头

### `providers/openai_codex_provider.py`
- **功能**: **OpenAI Codex提供商**
- **特点**: OAuth认证流程，支持GPT-5 Codex模型

### `providers/custom_provider.py`
- **功能**: **自定义OpenAI兼容端点**
- **用途**: 连接任意OpenAI兼容API（如vLLM、本地部署）

### `providers/transcription.py`
- **功能**: **语音转录提供商**
- **服务**: Groq Whisper API

---

## 📁 config/ - 配置模块

### `config/schema.py`
- **功能**: **配置模式定义**
- **使用**: Pydantic模型，支持camelCase/snake_case
- **配置项**: agents、channels、providers、gateway、tools

### `config/loader.py`
- **功能**: **配置加载器**
- **职责**: 加载JSON配置文件、配置迁移、多实例支持、配置保存

### `config/paths.py`
- **功能**: **运行时路径助手**
- **路径**: 数据目录、媒体目录、日志目录、工作区、历史文件

---

## 📁 cron/ - 定时任务模块

### `cron/service.py`
- **功能**: **定时任务服务**
- **职责**:
  - 管理定时任务（添加、删除、列出）
  - 支持一次性、间隔、cron表达式调度
  - 持久化存储（JSON）
  - 任务执行和状态跟踪

### `cron/types.py`
- **功能**: **定时任务数据类型**
- **类型**: CronSchedule、CronPayload、CronJob、CronStore

---

## 📁 session/ - 会话管理模块

### `session/manager.py` ⭐增强
- **功能**: **会话管理器**
- **职责**:
  - 管理对话历史（JSONL格式）
  - 会话持久化和加载
  - 历史消息对齐（工具调用边界）
  - 支持从旧版路径迁移
  - **会话删除**: `delete()` 方法支持删除会话文件
  - 会话列表查询

---

## 📁 web/ - Web网关模块 ⭐核心

### `web/gateway/server.py`
- **功能**: **Web网关服务**
- **职责**:
  - 提供Web前端托管（React SPA）
  - WebSocket实时聊天接口
  - REST API管理接口
  - 会话持久化管理
  - 通道动态重载
  - SkillHub集成
  - **外部消息广播**: 实时推送Telegram、QQ、Discord等平台消息到前端

### REST API端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/status` | GET | 获取系统状态 |
| `/api/channels` | GET | 获取通道列表 |
| `/api/channels/{name}/reload` | POST | 重载指定通道 |
| `/api/providers` | GET | 获取提供商列表 |
| `/api/skills` | GET | 获取本地技能列表 |
| `/api/skills/{name}` | GET | 获取技能详情 |
| `/api/skills/{name}` | DELETE | 删除工作区技能 |
| `/api/skillhub/search` | GET | 搜索SkillHub技能 |
| `/api/skillhub/install` | POST | 安装SkillHub技能 |
| `/api/cron` | GET | 获取定时任务列表 |
| `/api/cron` | POST | 创建定时任务 |
| `/api/cron/{job_id}` | DELETE | 删除定时任务 |
| `/api/config` | GET | 获取配置 |
| `/api/config` | POST | 更新配置 |
| `/api/sessions` | GET | 获取所有会话列表 |
| `/api/sessions/{key}` | GET | 获取会话详情和消息 |
| `/api/sessions/{key}` | DELETE | 删除会话 |
| `/ws/chat` | WebSocket | 实时聊天 |

### WebSocket消息格式

```json
// 客户端发送消息
{
  "type": "chat",
  "content": "用户消息内容",
  "session_id": "web-xxx-xxx"
}

// 服务端响应 - 开始流式输出
{
  "type": "stream_start",
  "id": "msg-xxx",
  "session_id": "web-xxx-xxx"
}

// 服务端响应 - 流式内容块
{
  "type": "stream_chunk",
  "id": "msg-xxx",
  "content": "部分内容"
}

// 服务端响应 - 流式结束
{
  "type": "stream_end",
  "id": "msg-xxx",
  "content": "完整内容",
  "session_id": "web-xxx-xxx"
}

// 服务端响应 - 外部平台消息 ⭐新增
{
  "type": "external_message",
  "channel": "telegram",
  "chat_id": "123456",
  "session_key": "telegram:123456",
  "content": "消息内容",
  "preview": "用户发送的消息预览"
}

// 服务端响应 - 错误
{
  "type": "error",
  "message_id": "msg-xxx",
  "error": "错误信息"
}
```

### Web前端功能

| 页面 | 功能 |
|------|------|
| Chat | 实时聊天、会话管理、历史记录、支持所有channel发送消息、外部平台消息实时显示 |
| Dashboard | 系统状态、统计信息 |
| Channels | 通道配置、启停控制、接入教程 |
| Providers | 提供商配置、模型设置、默认模型选择 |
| Skills | 本地技能管理、SkillHub搜索安装 |
| Scheduled Tasks | 定时任务管理（简化调度设置） |
| Settings | 系统配置管理、语言选择 |

---

## 📁 skillHub/ - SkillHub集成模块 ⭐新增

### `skillHub/metadata.json`
- **功能**: **SkillHub配置**
- **内容**:
  - 技能索引URL
  - 搜索API端点
  - 下载URL模板
  - 版本更新URL

### `skillHub/skill/SKILL.md`
- **功能**: **技能发现技能**
- **职责**:
  - 优先级技能发现流程
  - 中文优化策略（优先skillhub，回退clawhub）
  - 技能搜索、展示、安装

### `skillHub/skills_store_cli.py`
- **功能**: **SkillHub CLI工具**
- **命令**:
  - `skillhub search <query>`: 搜索技能
  - `skillhub install <slug>`: 安装技能
  - `skillhub upgrade`: 升级SkillHub

---

## 📁 security/ - 安全模块

### `security/network.py`
- **功能**: **网络安全工具**
- **职责**:
  - SSRF防护
  - 私有IP地址检测
  - URL目标验证
  - 重定向安全检查

---

## 📁 bus/ - 消息总线模块 ⭐增强

### `bus/events.py`
- **功能**: **事件类型定义**
- **类型**: InboundMessage（入站消息）、OutboundMessage（出站消息）

### `bus/queue.py`
- **功能**: **异步消息队列（发布-订阅模式）**
- **职责**: 
  - 解耦通道和代理核心的异步通信
  - **发布-订阅模式**: 支持多个订阅者同时接收消息
  - `subscribe_outbound()`: 订阅出站消息
  - `unsubscribe_outbound()`: 取消订阅
- **特点**: 
  - ChannelManager 和 WebGateway 同时订阅消息
  - 确保消息同时发送到外部平台和前端

---

## 📁 utils/ - 工具模块

### `utils/helpers.py`
- **功能**: **通用工具函数**
- **函数**:
  - 文件名安全处理
  - 消息分割
  - Token估算
  - 图片MIME检测
  - 时间格式化

### `utils/evaluator.py`
- **功能**: **后台任务评估器**
- **职责**: 决定后台任务结果是否需要通知用户

---

## 📁 cli/ - 命令行模块

### `cli/commands.py`
- **功能**: **CLI命令实现**
- **命令**:
  - `run`: 运行CLI交互模式
  - `gateway`: 运行Web网关模式
  - `status`: 查看系统状态
  - `init`: 初始化配置
- **特性**: 交互式对话、进度显示、历史记录

---

## 📁 heartbeat/ - 心跳服务模块

### `heartbeat/service.py`
- **功能**: **周期性心跳服务**
- **职责**:
  - 定期唤醒代理检查任务
  - 读取HEARTBEAT.md决定是否执行
  - 两阶段处理：决策 → 执行

---

## 📁 skills/ - 技能脚本模块

### 内置技能

| 技能 | 功能 |
|------|------|
| `clawhub` | ClawHub技能市场集成 |
| `cron` | 定时任务管理 |
| `github` | GitHub操作集成 |
| `memory` | 记忆管理 |
| `skill-creator` | 技能创建工具 |
| `summarize` | 内容摘要 |
| `tmux` | Tmux会话管理 |
| `weather` | 天气查询 |

### `skills/skill-creator/scripts/init_skill.py`
- **功能**: **技能初始化脚本**
- **职责**: 从模板创建新技能目录结构

### `skills/skill-creator/scripts/package_skill.py`
- **功能**: **技能打包脚本**
- **职责**: 将技能目录打包为可分发的.skill文件

### `skills/skill-creator/scripts/quick_validate.py`
- **功能**: **技能验证脚本**
- **职责**: 验证SKILL.md格式和内容完整性

---

## 📁 templates/ - 模板模块

### `templates/memory/__init__.py`
- **功能**: 记忆模板同步工具

### 模板文件

| 文件 | 用途 |
|------|------|
| `AGENTS.md` | 代理行为指南 |
| `HEARTBEAT.md` | 心跳任务配置 |
| `SOUL.md` | 代理人格定义 |
| `TOOLS.md` | 工具使用指南 |
| `USER.md` | 用户信息模板 |

---

## 架构总结

```
nanobot/
├── __main__.py              # 入口
├── __init__.py              # 版本和logo
├── agent/                   # 核心代理引擎
│   ├── __init__.py
│   ├── loop.py             # 主循环 ⭐
│   ├── context.py          # 上下文构建
│   ├── memory.py           # 记忆系统
│   ├── skills.py           # 技能加载
│   ├── subagent.py         # 子代理
│   └── tools/              # 工具集
│       ├── base.py         # 工具基类
│       ├── registry.py     # 工具注册表
│       ├── filesystem.py   # 文件系统工具
│       ├── shell.py        # Shell执行工具
│       ├── web.py          # 网络工具
│       ├── message.py      # 消息发送工具
│       ├── spawn.py        # 子代理生成
│       ├── cron.py         # 定时任务工具
│       └── mcp.py          # MCP协议客户端
├── channels/                # 多平台通道 (11+平台)
│   ├── base.py             # 通道基类
│   ├── registry.py         # 通道注册表
│   ├── manager.py          # 通道管理器 ⭐
│   ├── telegram.py         # Telegram
│   ├── discord.py          # Discord
│   ├── slack.py            # Slack
│   ├── feishu.py           # 飞书
│   ├── dingtalk.py         # 钉钉
│   ├── wecom.py            # 企业微信
│   ├── whatsapp.py         # WhatsApp
│   ├── email.py            # Email
│   ├── qq.py               # QQ
│   ├── matrix.py           # Matrix
│   └── mochat.py           # Mochat
├── providers/               # LLM提供商 (20+提供商)
│   ├── base.py             # 提供商基类
│   ├── registry.py         # 提供商注册表
│   ├── litellm_provider.py # LiteLLM统一提供商 ⭐
│   ├── azure_openai_provider.py
│   ├── openai_codex_provider.py
│   ├── custom_provider.py
│   └── transcription.py    # 语音转录
├── config/                  # 配置管理
│   ├── schema.py           # 配置模式
│   ├── loader.py           # 配置加载器
│   └── paths.py            # 路径助手
├── bus/                     # 消息总线 ⭐增强
│   ├── __init__.py
│   ├── events.py           # 事件类型
│   └── queue.py            # 异步队列（发布-订阅模式）
├── session/                 # 会话管理
│   ├── __init__.py
│   └── manager.py          # 会话管理器 ⭐
├── cron/                    # 定时任务
│   ├── service.py          # 任务服务
│   └── types.py            # 数据类型
├── security/                # 安全防护
│   └── network.py          # 网络安全
├── heartbeat/               # 心跳服务
│   └── service.py
├── web/                     # Web网关 ⭐核心
│   ├── __init__.py
│   ├── gateway/
│   │   ├── __init__.py
│   │   └── server.py       # HTTP/WebSocket服务
│   └── static/             # React前端静态文件
│       ├── index.html
│       ├── favicon.svg
│       └── assets/
├── skillHub/                # SkillHub集成 ⭐新增
│   ├── metadata.json       # SkillHub配置
│   ├── skills_store_cli.py # CLI工具
│   ├── skill/              # 技能发现技能
│   └── plugin/             # 插件配置
├── cli/                     # 命令行
│   └── commands.py
├── utils/                   # 工具函数
│   ├── helpers.py
│   └── evaluator.py
├── skills/                  # 内置技能
│   ├── clawhub/
│   ├── cron/
│   ├── github/
│   ├── memory/
│   ├── skill-creator/
│   ├── summarize/
│   ├── tmux/
│   └── weather/
└── templates/               # 模板
    ├── memory/
    ├── AGENTS.md
    ├── HEARTBEAT.md
    ├── SOUL.md
    ├── TOOLS.md
    └── USER.md
```

---

## 核心设计理念

1. **轻量级**: 比OpenClaw少99%代码
2. **模块化**: 清晰的模块边界和插件架构
3. **多平台**: 支持11+聊天平台
4. **多模型**: 支持20+LLM提供商
5. **安全优先**: SSRF防护、命令过滤、权限控制
6. **Web优先**: 内置React前端，开箱即用
7. **技能生态**: SkillHub技能市场集成
8. **实时同步**: 外部平台消息实时推送到前端
9. **国际化**: 支持中英文界面切换

---

## 支持的LLM提供商

| 提供商 | 类型 | 特点 |
|--------|------|------|
| Anthropic | 标准 | Claude系列，支持提示词缓存 |
| OpenAI | 标准 | GPT系列 |
| Azure OpenAI | 直接 | API版本2024-10-21，直接HTTP调用 |
| OpenAI Codex | OAuth | GPT-5 Codex，OAuth认证 |
| OpenRouter | 网关 | 多模型路由，支持提示词缓存 |
| DeepSeek | 标准 | DeepSeek系列 |
| Groq | 标准 | 快速推理，Whisper语音转录 |
| Gemini | 标准 | Google Gemini |
| Moonshot/Kimi | 标准 | 月之暗面，Kimi系列 |
| Xiaomi | 网关 | 小米MiMo模型 |
| MiniMax | 标准 | MiniMax系列 |
| Zhipu AI | 标准 | 智谱AI，GLM系列 |
| DashScope | 标准 | 阿里云百炼，Qwen系列 |
| VolcEngine | 网关 | 火山引擎，按量付费 |
| VolcEngine Coding Plan | 网关 | 火山引擎 Coding 套餐 |
| BytePlus | 网关 | 字节跳动国际版 |
| BytePlus Coding Plan | 网关 | 字节跳动 Coding 套餐 |
| SiliconFlow | 网关 | 硅基流动 |
| AiHubMix | 网关 | 多模型网关 |
| GitHub Copilot | OAuth | GitHub Copilot，OAuth认证 |
| vLLM | 本地 | 本地部署，OpenAI兼容 |
| Ollama | 本地 | 本地部署，OpenAI兼容 |
| Custom | 直接 | 自定义OpenAI兼容端点 |

---

## 支持的聊天平台

| 平台 | 协议 | 特点 |
|------|------|------|
| Telegram | Bot API | 支持流式、回复上下文、媒体组 |
| Discord | Gateway | WebSocket连接 |
| Slack | Socket Mode | 线程支持 |
| 飞书 | WebSocket | 富文本、媒体支持 |
| 钉钉 | Stream Mode | 企业通讯 |
| 企业微信 | WebSocket | 企业通讯 |
| WhatsApp | Bridge | Node.js桥接 |
| Email | IMAP/SMTP | 邮件收发 |
| QQ | botpy | 群聊、私聊 |
| Matrix | matrix-nio | 加密支持 |
| Mochat | Socket.IO | HTTP轮询回退 |

---

## 快速开始

```bash
# 安装
pip install nanobot-ai

# 初始化配置
nanobot init

# 运行（Web模式）- 推荐
nanobot gateway
# 访问 http://localhost:18790

# 运行（CLI模式）
nanobot run

# 查看状态
nanobot status
```

---

## Web前端功能

启动 `nanobot gateway` 后访问 `http://localhost:18790`：

### Chat页面
- 实时WebSocket聊天
- 会话历史持久化
- 多会话管理
- 支持所有channel的消息查看和发送
- **外部平台消息实时显示**: Telegram、QQ、Discord等平台消息实时推送到前端
- Web会话标题显示最后一条用户消息
- 支持语音和图片文件显示

### Dashboard页面
- 系统运行状态
- 连接客户端数量

### Channels页面
- 查看所有通道状态
- 启用/禁用通道
- 配置通道参数（Token、Secret等）
- 动态重载通道
- **接入教程**: 每个通道都有详细的接入教程按钮

### Providers页面
- 查看所有提供商
- 配置API Key和Base URL
- 设置默认模型

### Skills页面
- 查看本地技能列表
- 搜索SkillHub技能市场
- 一键安装技能

### Scheduled Tasks页面
- 查看定时任务列表
- **简化调度设置**: 支持每天、每小时、每周等简单选项
- 创建和管理定时任务

### Settings页面
- 系统配置管理
- **语言选择**: 支持中文和英文切换

---

## 消息流程架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Telegram      │     │   Discord       │     │   QQ            │
│   Channel       │     │   Channel       │     │   Channel       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │     MessageBus         │
                    │  (发布-订阅模式)        │
                    └───────────┬────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  ChannelManager │  │   WebGateway    │  │   AgentLoop     │
│  (订阅者)        │  │   (订阅者)      │  │   (处理者)      │
└────────┬────────┘  └────────┬────────┘  └─────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ 发送回复到       │  │ 推送到前端       │
│ 外部平台         │  │ WebSocket       │
└─────────────────┘  └─────────────────┘
```

---

## 通道接入教程

Channels 页面为每个通道提供详细的接入教程，包括：

| 平台 | 教程内容 |
|------|----------|
| Telegram | BotFather 创建机器人、获取 Token |
| Discord | 开发者平台创建 Bot、权限配置 |
| 飞书 | 开放平台创建应用、权限设置 |
| QQ | QQ 开放平台创建机器人 |
| Slack | 创建 Slack App、OAuth 配置 |
| 企业微信 | 创建企业应用、配置可信IP |
| 钉钉 | 创建企业内部机器人 |
| WhatsApp | WhatsApp Business API 配置 |

点击通道旁边的书本图标即可查看详细教程。

---

## 🖥️ 桌面应用

nanobot 提供跨平台桌面应用，支持 macOS、Windows 和 Linux。

### 构建桌面应用

```bash
# 进入 web 目录
cd web

# 安装依赖
npm install

# 构建 macOS 版本
npm run electron:build:mac

# 构建 Windows 版本
npm run electron:build:win

# 构建 Linux 版本
npm run electron:build:linux
```

### 桌面应用特性

- **原生体验**: 基于 Electron 的原生桌面应用
- **自动启动后端**: 应用启动时自动启动 Python 后端
- **系统托盘**: 支持最小化到系统托盘（开发中）
- **离线使用**: 支持本地 LLM（Ollama）离线使用
- **窗口管理**: 支持最小化、最大化、关闭窗口
- **macOS 优化**: 关闭窗口时后端继续运行，重新打开应用秒级响应

### 桌面应用架构

```
web/
├── electron/
│   ├── main.cjs          # Electron 主进程
│   └── preload.cjs       # 预加载脚本
├── src/                  # React 前端源码
├── dist/                 # 前端构建输出
└── dist-electron/        # Electron 打包输出
```

---

## 更新日志

### 2026-03-30
- **桌面应用**: 支持 macOS、Windows、Linux 桌面应用
- **后端启动优化**: Web Gateway 优先启动，前端快速连接
- **启动加载提示**: 后端启动时显示加载动画和状态提示
- **消息折叠**: AI 回复支持折叠/展开，多次回复默认折叠旧消息
- **WebSocket 连接修复**: 修复连接数不断增加的问题
- **macOS 窗口优化**: 关闭窗口时后端继续运行

### 2026-03-20
- **消息总线重构**: 改为发布-订阅模式，支持多个订阅者
- **外部消息实时推送**: Telegram、QQ、Discord等平台消息实时显示在前端
- **通道接入教程**: Channels 页面增加每个通道的详细接入教程
- **国际化支持**: 前端支持中英文切换
- **简化调度设置**: 定时任务支持每天、每小时、每周等简单选项
- **Xiaomi 提供商**: 支持小米 MiMo 模型
- **语音图片支持**: 前端支持显示语音和图片文件
- **侧边栏折叠**: 支持侧边栏收起只显示图标
