import { useEffect, useState } from 'react'
import { Settings, Power, PowerOff, Loader2, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import { api, type Channel } from '../services/api'
import ChannelConfigModal from '../components/ChannelConfigModal'
import ChannelTutorialModal from '../components/ChannelTutorialModal'
import { useI18n } from '../store/i18nStore'

export default function Channels() {
  const { t } = useI18n()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    setLoading(true)
    try {
      const res = await api.getChannels()
      setChannels(res.channels)
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      const config = await api.getConfig()
      if (!config.channels[channelId]) {
        config.channels[channelId] = { enabled: false }
      }
      config.channels[channelId].enabled = !enabled
      await api.updateConfig(config)
      await api.reloadChannel(channelId)
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId ? { ...c, enabled: !enabled, status: !enabled ? 'connected' : 'disconnected' } : c
        )
      )
    } catch (error) {
      console.error('Failed to toggle channel:', error)
      alert('Failed to toggle channel. Please try again.')
    }
  }

  const openConfig = (channel: Channel) => {
    setSelectedChannel(channel)
    setConfigModalOpen(true)
  }

  const openTutorial = (channel: Channel) => {
    setSelectedChannel(channel)
    setTutorialModalOpen(true)
  }

  const handleSaveConfig = async () => {
    if (selectedChannel) {
      await api.reloadChannel(selectedChannel.id)
    }
    fetchChannels()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.channels.title}</h1>
        <a
          href="https://github.com/HKUDS/nanobot#-chat-apps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-500 hover:text-primary-600"
        >
          View Documentation
        </a>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        {t.channels.configureInConfig}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{channel.name}</h3>
              <div className="flex items-center gap-2">
                {channel.enabled ? (
                  <Power size={16} className="text-green-500" />
                ) : (
                  <PowerOff size={16} className="text-gray-400" />
                )}
                <span
                  className={clsx(
                    'text-xs px-2 py-1 rounded',
                    channel.enabled
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  )}
                >
                  {channel.enabled ? t.channels.enabled : t.channels.disabled}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleChannel(channel.id, channel.enabled)}
                className={clsx(
                  'text-sm px-3 py-1 rounded transition-colors',
                  channel.enabled
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                )}
              >
                {channel.enabled ? t.channels.stop : t.channels.start}
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openTutorial(channel)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={t.channels.tutorial}
                >
                  <BookOpen size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={() => openConfig(channel)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={t.channels.configure}
                >
                  <Settings size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedChannel && (
        <>
          <ChannelConfigModal
            channelId={selectedChannel.id}
            channelName={selectedChannel.name}
            isOpen={configModalOpen}
            onClose={() => setConfigModalOpen(false)}
            onSave={handleSaveConfig}
          />
          <ChannelTutorialModal
            channelId={selectedChannel.id}
            channelName={selectedChannel.name}
            isOpen={tutorialModalOpen}
            onClose={() => setTutorialModalOpen(false)}
          />
        </>
      )}
    </div>
  )
}
