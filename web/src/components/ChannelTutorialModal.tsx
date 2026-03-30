import { useState } from 'react'
import { X, BookOpen, ExternalLink } from 'lucide-react'
import { useI18n } from '../store/i18nStore'

interface ChannelTutorialModalProps {
  channelId: string
  channelName: string
  isOpen: boolean
  onClose: () => void
}

const TUTORIALS: Record<string, { title: string; steps: string[]; links: { title: string; url: string }[] }> = {
  telegram: {
    title: 'Telegram Bot 接入教程',
    steps: [
      '1. 打开 Telegram，搜索 @BotFather',
      '2. 发送 /newbot 命令创建新机器人',
      '3. 按提示设置机器人名称和用户名',
      '4. 复制 BotFather 返回的 Token',
      '5. 在 nanobot 配置中填入 token',
      '6. 设置 allowFrom 为 ["*"] 允许所有用户',
      '7. 启动通道后，在 Telegram 中向机器人发送消息即可',
    ],
    links: [
      { title: 'Telegram Bot 官方文档', url: 'https://core.telegram.org/bots' },
      { title: 'BotFather 使用指南', url: 'https://core.telegram.org/bots#6-botfather' },
    ],
  },
  feishu: {
    title: '飞书机器人接入教程',
    steps: [
      '1. 访问飞书开放平台 https://open.feishu.cn',
      '2. 创建企业自建应用',
      '3. 在"凭证与基础信息"获取 App ID 和 App Secret',
      '4. 在"事件订阅"中添加事件：im.message.receive_v1',
      '5. 在"权限管理"中开通权限：',
      '   - im:message（获取与发送消息）',
      '   - im:message:receive_as_bot（以应用身份读取消息）',
      '6. 发布应用版本',
      '7. 在 nanobot 配置中填入 appId 和 appSecret',
      '8. 启动通道后，在飞书中向机器人发送消息',
    ],
    links: [
      { title: '飞书开放平台', url: 'https://open.feishu.cn' },
      { title: '机器人开发指南', url: 'https://open.feishu.cn/document/ukTMukTMukTM/uYjNwUjL2YDM14iN2ATN' },
    ],
  },
  qq: {
    title: 'QQ 机器人接入教程',
    steps: [
      '1. 访问 QQ 开放平台 https://q.qq.com',
      '2. 创建机器人应用',
      '3. 在应用详情页获取 App ID 和 Secret',
      '4. 在"开发设置"中配置消息接收',
      '5. 在 nanobot 配置中填入 appId 和 secret',
      '6. 设置 allowFrom 为 ["*"] 允许所有用户',
      '7. 启动通道后，在 QQ 中向机器人发送消息',
    ],
    links: [
      { title: 'QQ 开放平台', url: 'https://q.qq.com' },
      { title: 'QQ 机器人开发文档', url: 'https://bot.q.qq.com/wiki' },
    ],
  },
  discord: {
    title: 'Discord Bot 接入教程',
    steps: [
      '1. 访问 Discord 开发者平台 https://discord.com/developers/applications',
      '2. 点击 "New Application" 创建应用',
      '3. 在左侧菜单选择 "Bot"，点击 "Add Bot"',
      '4. 点击 "Reset Token" 获取 Bot Token',
      '5. 在 "OAuth2 > URL Generator" 中生成邀请链接：',
      '   - 勾选 bot 权限',
      '   - 勾选 Send Messages、Read Message History 等权限',
      '6. 使用邀请链接将机器人添加到服务器',
      '7. 在 nanobot 配置中填入 token',
      '8. 启动通道后，在 Discord 中向机器人发送消息',
    ],
    links: [
      { title: 'Discord 开发者平台', url: 'https://discord.com/developers/applications' },
      { title: 'Discord Bot 开发文档', url: 'https://discord.com/developers/docs/intro' },
    ],
  },
  slack: {
    title: 'Slack Bot 接入教程',
    steps: [
      '1. 访问 Slack API https://api.slack.com/apps',
      '2. 点击 "Create New App" 创建应用',
      '3. 选择 "From scratch"，选择工作区',
      '4. 在 "OAuth & Permissions" 中添加权限：',
      '   - chat:write（发送消息）',
      '   - im:history（读取私信）',
      '   - channels:history（读取频道消息）',
      '5. 点击 "Install to Workspace" 安装应用',
      '6. 复制 Bot User OAuth Token',
      '7. 在 nanobot 配置中填入 token',
      '8. 启动通道后，在 Slack 中向机器人发送消息',
    ],
    links: [
      { title: 'Slack API', url: 'https://api.slack.com' },
      { title: 'Slack Bot 开发指南', url: 'https://api.slack.com/start/building/bolt' },
    ],
  },
  wecom: {
    title: '企业微信机器人接入教程',
    steps: [
      '1. 登录企业微信管理后台 https://work.weixin.qq.com',
      '2. 在"应用管理"中创建应用',
      '3. 获取 AgentId 和 Secret',
      '4. 在"我的企业"获取企业 ID (CorpId)',
      '5. 在 nanobot 配置中填入相关信息',
      '6. 设置可信IP或使用内网穿透',
      '7. 启动通道后，在企业微信中向机器人发送消息',
    ],
    links: [
      { title: '企业微信管理后台', url: 'https://work.weixin.qq.com' },
      { title: '企业微信开发文档', url: 'https://developer.work.weixin.qq.com/document' },
    ],
  },
  dingtalk: {
    title: '钉钉机器人接入教程',
    steps: [
      '1. 登录钉钉开发者平台 https://open.dingtalk.com',
      '2. 创建企业内部机器人',
      '3. 获取 AppKey 和 AppSecret',
      '4. 配置消息接收地址',
      '5. 在 nanobot 配置中填入相关信息',
      '6. 启动通道后，在钉钉中向机器人发送消息',
    ],
    links: [
      { title: '钉钉开发者平台', url: 'https://open.dingtalk.com' },
      { title: '钉钉机器人开发文档', url: 'https://open.dingtalk.com/document/org/robot-overview' },
    ],
  },
  whatsapp: {
    title: 'WhatsApp Business 接入教程',
    steps: [
      '1. 访问 Meta for Developers https://developers.facebook.com',
      '2. 创建 WhatsApp Business 应用',
      '3. 在应用设置中获取 Phone Number ID',
      '4. 生成永久访问令牌',
      '5. 配置 Webhook 接收消息',
      '6. 在 nanobot 配置中填入 token 和 phoneNumberId',
      '7. 启动通道后，在 WhatsApp 中向机器人发送消息',
    ],
    links: [
      { title: 'Meta for Developers', url: 'https://developers.facebook.com' },
      { title: 'WhatsApp Business API', url: 'https://developers.facebook.com/docs/whatsapp' },
    ],
  },
}

export default function ChannelTutorialModal({ channelId, channelName, isOpen, onClose }: ChannelTutorialModalProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'tutorial' | 'links'>('tutorial')

  if (!isOpen) return null

  const tutorial = TUTORIALS[channelId]

  if (!tutorial) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {channelName} {t.channels.tutorial}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            暂无 {channelName} 的详细教程，请参考官方文档。
          </p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-primary-500" />
            {tutorial.title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('tutorial')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tutorial'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            接入步骤
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'links'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            相关链接
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === 'tutorial' && (
            <div className="space-y-3">
              {tutorial.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{step}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-3">
              {tutorial.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{link.title}</span>
                  <ExternalLink size={16} className="text-gray-400" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            {t.common.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
