import { useEffect, useState } from 'react'
import { BookOpen, Check, X, Loader2, Terminal, Key, Search, Download, Cloud, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { api, type Skill, type SkillDetail, type SkillHubResult } from '../services/api'
import { useI18n } from '../store/i18nStore'

export default function Skills() {
  const { t } = useI18n()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SkillHubResult[]>([])
  const [searching, setSearching] = useState(false)
  const [installing, setInstalling] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'installed' | 'hub'>('installed')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const res = await api.getSkills()
      setSkills(res.skills)
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSkill = async (skill: Skill) => {
    try {
      const detail = await api.getSkill(skill.id)
      setSelectedSkill(detail)
    } catch (error) {
      console.error('Failed to fetch skill detail:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await api.searchSkillHub(searchQuery)
      setSearchResults(res.results || [])
    } catch (error) {
      console.error('Failed to search SkillHub:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleInstall = async (slug: string) => {
    setInstalling(slug)
    try {
      await api.installSkillHub(slug)
      await fetchSkills()
      setSearchResults(prev => prev.filter(r => r.slug !== slug))
      setActiveTab('installed')
    } catch (error) {
      console.error('Failed to install skill:', error)
      alert('Failed to install skill')
    } finally {
      setInstalling(null)
    }
  }

  const handleDelete = async (skill: Skill) => {
    if (skill.source === 'builtin') {
      alert('Cannot delete built-in skills')
      return
    }
    if (!confirm(`Are you sure you want to delete "${skill.name}"?`)) {
      return
    }
    setDeleting(skill.id)
    try {
      await api.deleteSkill(skill.id)
      await fetchSkills()
    } catch (error) {
      console.error('Failed to delete skill:', error)
      alert('Failed to delete skill')
    } finally {
      setDeleting(null)
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.skills.title}</h1>
        <a
          href="https://github.com/HKUDS/nanobot/tree/main/nanobot/skills"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <BookOpen size={18} />
          <span>Docs</span>
        </a>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('installed')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'installed'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          {t.skills.localSkills} ({skills.length})
        </button>
        <button
          onClick={() => setActiveTab('hub')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'hub'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <Cloud size={16} />
          {t.skills.skillHub}
        </button>
      </div>

      {activeTab === 'hub' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t.skills.search}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {t.common.search}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.skills.title}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.common.search}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.common.search}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.cron.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((result) => {
                    const isInstalled = skills.some(s => s.id === result.slug)
                    return (
                      <tr key={result.slug} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900 dark:text-white">{result.name}</span>
                          <span className="ml-2 text-xs text-gray-400">{result.slug}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                            {result.description || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm">
                          {result.version || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {isInstalled ? (
                            <span className="inline-flex items-center gap-1 text-green-500 text-sm">
                              <Check size={16} />
                              {t.skills.installed}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleInstall(result.slug)}
                              disabled={installing === result.slug}
                              className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-1 ml-auto"
                            >
                              {installing === result.slug ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                              {t.skills.install}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t.skills.noSkills} "{searchQuery}"
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Cloud size={16} className="inline mr-1" />
              {t.skills.installFromSkillHub}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'installed' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.skills.title}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.common.search}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.cron.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.common.search}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.cron.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {skills.map((skill) => (
                  <tr key={skill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {skill.emoji && <span className="text-lg">{skill.emoji}</span>}
                        <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                        {skill.description || skill.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 text-sm',
                          skill.available ? 'text-green-500' : 'text-amber-500'
                        )}
                      >
                        {skill.available ? <Check size={16} /> : <X size={16} />}
                        {skill.available ? 'Available' : 'Missing deps'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs rounded-full',
                          skill.source === 'workspace'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        )}
                      >
                        {skill.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewSkill(skill)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="View"
                        >
                          <BookOpen size={16} className="text-gray-500" />
                        </button>
                        {skill.source === 'workspace' && (
                          <button
                            onClick={() => handleDelete(skill)}
                            disabled={deleting === skill.id}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === skill.id ? (
                              <Loader2 size={16} className="text-red-500 animate-spin" />
                            ) : (
                              <Trash2 size={16} className="text-red-500" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {skills.filter((s) => !s.available).length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Missing Dependencies</h3>
              <div className="space-y-2">
                {skills
                  .filter((s) => !s.available)
                  .map((skill) => (
                    <div key={skill.id} className="text-sm text-amber-700 dark:text-amber-300">
                      <span className="font-medium">{skill.name}</span>:
                      {skill.missing.bins.length > 0 && (
                        <span className="ml-2 flex items-center gap-1">
                          <Terminal size={14} />
                          CLI tools: {skill.missing.bins.join(', ')}
                        </span>
                      )}
                      {skill.missing.env.length > 0 && (
                        <span className="ml-2 flex items-center gap-1">
                          <Key size={14} />
                          Env vars: {skill.missing.env.join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Skills extend nanobot's capabilities. The agent can read skill instructions from SKILL.md files when needed.
              Workspace skills are stored in <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">~/.nanobot/skills/</code>.
            </p>
          </div>
        </>
      )}

      {selectedSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedSkill.emoji ? `${selectedSkill.emoji} ` : ''}{selectedSkill.name}
              </h2>
              <button
                onClick={() => setSelectedSkill(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {selectedSkill.description}
            </p>
            <div className="flex-1 overflow-auto">
              <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                {selectedSkill.content}
              </pre>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedSkill(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
