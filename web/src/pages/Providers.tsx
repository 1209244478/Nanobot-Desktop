import { useEffect, useState } from 'react'
import { Settings, Check, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { api, type Provider, type Config } from '../services/api'
import { useI18n } from '../store/i18nStore'

const PROVIDER_PREFIXES: Record<string, string[]> = {
  openai: ['gpt-', 'o1-', 'o3-', 'chatgpt'],
  anthropic: ['claude'],
  deepseek: ['deepseek'],
  openrouter: ['openrouter/', 'anthropic/', 'meta-llama/', 'mistralai/', 'google/', 'x-ai/'],
  groq: ['groq/', 'llama-', 'mixtral-', 'gemma-'],
  zhipu: ['glm-', 'zhipu/'],
  dashscope: ['qwen-', 'dashscope/'],
  ollama: ['llama', 'mistral', 'qwen', 'phi', 'gemma', 'codellama'],
  gemini: ['gemini'],
  moonshot: ['moonshot'],
  xiaomi: ['xiaomi/', 'mimo'],
  minimax: ['minimax'],
  aihubmix: ['aihubmix/'],
  siliconflow: ['siliconflow/', 'Qwen/', 'deepseek-'],
  volcengine: ['volcengine/', 'doubao'],
  custom: [],
}

function extractProviderFromModel(model: string): string | null {
  if (!model) return null
  const lowerModel = model.toLowerCase()
  
  if (model.includes('/')) {
    const prefix = model.split('/')[0].toLowerCase()
    for (const provider of Object.keys(PROVIDER_PREFIXES)) {
      if (prefix === provider || prefix.replace(/-/g, '_') === provider) {
        return provider
      }
    }
  }
  
  for (const [provider, prefixes] of Object.entries(PROVIDER_PREFIXES)) {
    for (const prefix of prefixes) {
      if (lowerModel.startsWith(prefix.toLowerCase())) {
        return provider
      }
    }
  }
  
  return null
}

export default function Providers() {
  const { t } = useI18n()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeModel, setActiveModel] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providersRes, configRes] = await Promise.all([
          api.getProviders(),
          api.getConfig(),
        ])
        setProviders(providersRes.providers)
        setConfig(configRes)
        setActiveModel(configRes.agents.defaults.model || '')
      } catch (error) {
        console.error('Failed to fetch providers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getActiveProvider = () => {
    return extractProviderFromModel(activeModel)
  }

  const handleSetActive = async (provider: Provider) => {
    if (!config) return
    const providerConfig = config.providers[provider.id]
    if (!providerConfig?.model) {
      alert(t.providers.configureModelFirst)
      return
    }
    setSaving(true)
    try {
      const modelValue = providerConfig.model
      const newConfig = {
        ...config,
        agents: {
          ...config.agents,
          defaults: {
            ...config.agents.defaults,
            model: modelValue,
          },
        },
      }
      await api.updateConfig(newConfig)
      setConfig(newConfig)
      setActiveModel(modelValue)
    } catch (error) {
      console.error('Failed to set active model:', error)
      alert('Failed to set active model')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!config || !selectedProvider) return
    setSaving(true)
    try {
      const activeProviderId = getActiveProvider()
      const newModel = config.providers[selectedProvider.id]?.model
      
      let configToUpdate = config
      if (activeProviderId === selectedProvider.id && newModel) {
        configToUpdate = {
          ...config,
          agents: {
            ...config.agents,
            defaults: {
              ...config.agents.defaults,
              model: newModel,
            },
          },
        }
        setActiveModel(newModel)
      }
      
      await api.updateConfig(configToUpdate)
      setConfig(configToUpdate)
      
      const providersRes = await api.getProviders()
      setProviders(providersRes.providers)
      setSelectedProvider(null)
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  const activeProviderId = getActiveProvider()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.providers.title}</h1>
        <div className="flex items-center gap-4">
          {activeModel && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t.providers.active}: <span className="font-medium text-gray-700 dark:text-gray-300">{activeModel}</span>
            </span>
          )}
          <a
            href="https://github.com/HKUDS/nanobot#configuration"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Settings size={18} />
            <span>Docs</span>
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                {t.providers.active}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.providers.provider}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.providers.configured}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.providers.model}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.providers.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {providers.map((provider) => {
              const isActive = activeProviderId === provider.id
              const hasModel = config?.providers[provider.id]?.model
              const isConfigured = provider.configured
              return (
                <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSetActive(provider)}
                      disabled={!hasModel || saving}
                      className={clsx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        isActive
                          ? 'border-primary-500 bg-primary-500'
                          : hasModel
                          ? 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                          : 'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
                      )}
                      title={hasModel ? t.providers.setAsActive : t.providers.configureModelFirst}
                    >
                      {isActive && <Check size={12} className="text-white" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900 dark:text-white">{provider.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 text-sm',
                        isConfigured ? 'text-green-500' : 'text-gray-400'
                      )}
                    >
                      {isConfigured ? <Check size={16} /> : <X size={16} />}
                      {isConfigured ? t.providers.yes : t.providers.no}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {provider.model || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedProvider(provider)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Settings size={16} className="text-gray-500" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t.providers.clickToSelect}
        </p>
      </div>

      {selectedProvider && config && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.providers.configure} {selectedProvider.name}
              </h2>
              <button
                onClick={() => setSelectedProvider(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.providers.apiKey}
                </label>
                <input
                  type="password"
                  value={config.providers[selectedProvider.id]?.api_key || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      providers: {
                        ...config.providers,
                        [selectedProvider.id]: {
                          ...config.providers[selectedProvider.id],
                          api_key: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.providers.apiBaseUrl}
                </label>
                <input
                  type="text"
                  value={config.providers[selectedProvider.id]?.api_base || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      providers: {
                        ...config.providers,
                        [selectedProvider.id]: {
                          ...config.providers[selectedProvider.id],
                          api_base: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://api.example.com/v1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.providers.model}
                </label>
                <input
                  type="text"
                  value={config.providers[selectedProvider.id]?.model || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      providers: {
                        ...config.providers,
                        [selectedProvider.id]: {
                          ...config.providers[selectedProvider.id],
                          model: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={selectedProvider.id === 'openrouter' ? 'anthropic/claude-3-opus' : 'gpt-4-turbo'}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedProvider.id === 'openrouter' ? 'Use full model name like: anthropic/claude-3-opus, xiaomi/mimo-v2' : 'Enter model name (e.g., gpt-4-turbo, deepseek-chat)'}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
