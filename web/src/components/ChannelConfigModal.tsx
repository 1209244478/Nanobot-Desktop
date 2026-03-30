import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { api, type Config } from '../services/api'

interface ChannelConfigModalProps {
  channelId: string
  channelName: string
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const CHANNEL_CONFIG_FIELDS: Record<string, { key: string; label: string; type: string; placeholder?: string; required?: boolean }[]> = {
  telegram: [
    { key: 'token', label: 'Bot Token', type: 'text', placeholder: '123456:ABC-DEF...', required: true },
    { key: 'proxy', label: 'Proxy URL', type: 'text', placeholder: 'http://proxy:8080' },
  ],
  discord: [
    { key: 'token', label: 'Bot Token', type: 'text', required: true },
    { key: 'gatewayUrl', label: 'Gateway URL', type: 'text', placeholder: 'wss://gateway.discord.gg/?v=10&encoding=json' },
    { key: 'intents', label: 'Intents', type: 'number', placeholder: '37377' },
  ],
  slack: [
    { key: 'botToken', label: 'Bot Token', type: 'text', placeholder: 'xoxb-...', required: true },
    { key: 'appToken', label: 'App Token', type: 'text', placeholder: 'xapp-...', required: true },
  ],
  feishu: [
    { key: 'appId', label: 'App ID', type: 'text', required: true },
    { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
    { key: 'encryptKey', label: 'Encrypt Key', type: 'password' },
    { key: 'verificationToken', label: 'Verification Token', type: 'text' },
  ],
  dingtalk: [
    { key: 'clientId', label: 'Client ID', type: 'text', required: true },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
  ],
  wecom: [
    { key: 'botId', label: 'Bot ID', type: 'text', required: true },
    { key: 'secret', label: 'Secret', type: 'password', required: true },
    { key: 'welcomeMessage', label: 'Welcome Message', type: 'text' },
  ],
  whatsapp: [
    { key: 'bridgeUrl', label: 'Bridge URL', type: 'text', placeholder: 'ws://localhost:3001', required: true },
    { key: 'bridgeToken', label: 'Bridge Token', type: 'password' },
  ],
  email: [
    { key: 'imapHost', label: 'IMAP Host', type: 'text', placeholder: 'imap.gmail.com', required: true },
    { key: 'imapPort', label: 'IMAP Port', type: 'number', placeholder: '993' },
    { key: 'imapUsername', label: 'IMAP Username', type: 'text', required: true },
    { key: 'imapPassword', label: 'IMAP Password', type: 'password', required: true },
    { key: 'smtpHost', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
    { key: 'smtpPort', label: 'SMTP Port', type: 'number', placeholder: '587' },
    { key: 'smtpUsername', label: 'SMTP Username', type: 'text' },
    { key: 'smtpPassword', label: 'SMTP Password', type: 'password' },
    { key: 'fromAddress', label: 'From Address', type: 'text', required: true },
  ],
  qq: [
    { key: 'appId', label: 'App ID', type: 'text', required: true },
    { key: 'secret', label: 'Secret', type: 'password', required: true },
  ],
  mochat: [
    { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://mochat.io' },
    { key: 'clawToken', label: 'Claw Token', type: 'password', required: true },
    { key: 'agentUserId', label: 'Agent User ID', type: 'text', required: true },
  ],
}

export default function ChannelConfigModal({ channelId, channelName, isOpen, onClose, onSave }: ChannelConfigModalProps) {
  const [config, setConfig] = useState<Config | null>(null)
  const [channelConfig, setChannelConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fields = CHANNEL_CONFIG_FIELDS[channelId] || []

  useEffect(() => {
    if (isOpen) {
      loadConfig()
    }
  }, [isOpen, channelId])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await api.getConfig()
      setConfig(res)
      setChannelConfig(res.channels[channelId] || {})
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const newConfig = { ...config }
      newConfig.channels[channelId] = { 
        enabled: channelConfig.enabled || false,
        ...channelConfig 
      }
      await api.updateConfig(newConfig)
      onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Failed to save configuration. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: string, value: any) => {
    setChannelConfig((prev) => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configure {channelName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={channelConfig.enabled || false}
                  onChange={(e) => updateField('enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable this channel
                </label>
              </div>

              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={channelConfig[field.key] || ''}
                    onChange={(e) => updateField(field.key, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Allowed Users (comma-separated)
                </label>
                <input
                  type="text"
                  value={(channelConfig.allowFrom || []).join(', ')}
                  onChange={(e) => updateField('allowFrom', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="user1, user2, user3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors',
              saving || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600'
            )}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  )
}
