import { useEffect, useState } from 'react'
import { Save, RotateCcw, Loader2 } from 'lucide-react'
import { api, type Config } from '../services/api'
import { useI18n } from '../store/i18nStore'

export default function Settings() {
  const { t, language, setLanguage } = useI18n()
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.getConfig()
        setConfig(res)
      } catch (error) {
        console.error('Failed to fetch config:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      await api.updateConfig(config)
      alert(t.settings.configSaved)
    } catch (error) {
      console.error('Failed to save config:', error)
      alert(t.settings.configSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setLoading(true)
    try {
      const res = await api.getConfig()
      setConfig(res)
    } catch (error) {
      console.error('Failed to reset config:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={18} />
            <span>{t.common.reset}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{t.common.save}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.settings.language}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.language}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{t.settings.languageDesc}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.settings.agentDefaults}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.defaultModel}
              </label>
              <input
                type="text"
                value={config.agents.defaults.model}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agents: {
                      ...config.agents,
                      defaults: { ...config.agents.defaults, model: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.maxTokens}
              </label>
              <input
                type="number"
                value={config.agents.defaults.max_tokens}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agents: {
                      ...config.agents,
                      defaults: { ...config.agents.defaults, max_tokens: parseInt(e.target.value) },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.temperature}
              </label>
              <input
                type="number"
                step="0.1"
                value={config.agents.defaults.temperature}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agents: {
                      ...config.agents,
                      defaults: { ...config.agents.defaults, temperature: parseFloat(e.target.value) },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.contextWindow}
              </label>
              <input
                type="number"
                value={config.agents.defaults.context_window_tokens}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agents: {
                      ...config.agents,
                      defaults: { ...config.agents.defaults, context_window_tokens: parseInt(e.target.value) },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.settings.gatewaySettings}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.host}
              </label>
              <input
                type="text"
                value={config.gateway.host}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    gateway: { ...config.gateway, host: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.port}
              </label>
              <input
                type="number"
                value={config.gateway.port}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    gateway: { ...config.gateway, port: parseInt(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.settings.heartbeatEnabled}
              </label>
              <button
                onClick={() =>
                  setConfig({
                    ...config,
                    gateway: {
                      ...config.gateway,
                      heartbeat: { ...config.gateway.heartbeat, enabled: !config.gateway.heartbeat.enabled },
                    },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  config.gateway.heartbeat.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    config.gateway.heartbeat.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.heartbeatInterval}
              </label>
              <input
                type="number"
                value={config.gateway.heartbeat.interval_s}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    gateway: {
                      ...config.gateway,
                      heartbeat: { ...config.gateway.heartbeat, interval_s: parseInt(e.target.value) },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.settings.webTools}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.searchProvider}
              </label>
              <select
                value={config.tools.web.search.provider}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    tools: {
                      ...config.tools,
                      web: { ...config.tools.web, search: { ...config.tools.web.search, provider: e.target.value } },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option>brave</option>
                <option>tavily</option>
                <option>duckduckgo</option>
                <option>searxng</option>
                <option>jina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.proxyUrl}
              </label>
              <input
                type="text"
                value={config.tools.web.proxy || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    tools: {
                      ...config.tools,
                      web: { ...config.tools.web, proxy: e.target.value || null },
                    },
                  })
                }
                placeholder="http://127.0.0.1:7890"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.settings.execTimeout}
              </label>
              <input
                type="number"
                value={config.tools.exec.timeout}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    tools: {
                      ...config.tools,
                      exec: { ...config.tools.exec, timeout: parseInt(e.target.value) },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.settings.security}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.settings.restrictToWorkspace}
              </label>
              <button
                onClick={() =>
                  setConfig({
                    ...config,
                    tools: { ...config.tools, restrict_to_workspace: !config.tools.restrict_to_workspace },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  config.tools.restrict_to_workspace ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    config.tools.restrict_to_workspace ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
