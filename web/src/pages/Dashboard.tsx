import { useEffect, useState } from 'react'
import { MessageSquare, Radio, Server, Clock, Zap, Loader2 } from 'lucide-react'
import { api, type Status, type Channel, type Provider, type CronJob } from '../services/api'
import { useI18n } from '../store/i18nStore'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useI18n()
  const [status, setStatus] = useState<Status | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, channelsRes, providersRes, cronRes] = await Promise.all([
          api.getStatus(),
          api.getChannels(),
          api.getProviders(),
          api.getCronJobs(),
        ])
        setStatus(statusRes)
        setChannels(channelsRes.channels)
        setProviders(providersRes.providers)
        setCronJobs(cronRes.jobs)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  const enabledChannels = channels.filter((c) => c.enabled).length
  const configuredProviders = providers.filter((p) => p.configured).length
  const enabledJobs = cronJobs.filter((j) => j.enabled).length

  const stats = [
    { title: t.channels.title, value: enabledChannels, icon: Radio, color: 'bg-blue-500' },
    { title: t.dashboard.connectedClients, value: status?.connected_clients || 0, icon: MessageSquare, color: 'bg-green-500' },
    { title: t.providers.title, value: configuredProviders, icon: Server, color: 'bg-purple-500' },
    { title: t.cron.title, value: enabledJobs, icon: Clock, color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h1>
        <div className="flex items-center gap-2 text-green-500">
          <Zap size={16} />
          <span className="text-sm">{t.dashboard.status}: {status?.status || 'Unknown'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.channels.running}
          </h2>
          <div className="space-y-4">
            {channels.filter((c) => c.enabled).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t.channels.noChannels}</p>
            ) : (
              channels.filter((c) => c.enabled).map((channel) => (
                <div key={channel.id} className="flex items-center gap-3 text-sm">
                  <Radio size={16} className="text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">{channel.name}</span>
                  <span className="text-green-500 ml-auto">{channel.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.dashboard.status}
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Agent Loop', status: 'running' },
              { name: 'Heartbeat Service', status: 'running' },
              { name: 'Cron Service', status: 'running' },
              { name: 'Web Gateway', status: 'running' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    item.status === 'running'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
