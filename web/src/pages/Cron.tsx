import { useEffect, useState } from 'react'
import { Plus, Play, Pause, Trash2, Clock, Loader2, X } from 'lucide-react'
import clsx from 'clsx'
import { api, type CronJob } from '../services/api'
import { useI18n } from '../store/i18nStore'

type ScheduleType = 'daily' | 'hourly' | 'weekly' | 'custom'

interface ScheduleConfig {
  type: ScheduleType
  hour: number
  minute: number
  weekday: number
  custom: string
}

function scheduleToCron(config: ScheduleConfig): string {
  switch (config.type) {
    case 'hourly':
      return `${config.minute} * * * *`
    case 'daily':
      return `${config.minute} ${config.hour} * * *`
    case 'weekly':
      return `${config.minute} ${config.hour} * * ${config.weekday}`
    case 'custom':
      return config.custom
    default:
      return '0 9 * * *'
  }
}

function cronToSchedule(cron: string): ScheduleConfig {
  const parts = cron.split(' ')
  if (parts.length !== 5) {
    return { type: 'daily', hour: 9, minute: 0, weekday: 1, custom: cron }
  }
  
  const [minute, hour, day, month, weekday] = parts
  
  if (hour === '*' && minute !== '*' && day === '*' && month === '*' && weekday === '*') {
    return { type: 'hourly', hour: 0, minute: parseInt(minute) || 0, weekday: 1, custom: cron }
  }
  
  if (weekday !== '*' && hour !== '*' && minute !== '*') {
    return { type: 'weekly', hour: parseInt(hour) || 9, minute: parseInt(minute) || 0, weekday: parseInt(weekday) || 1, custom: cron }
  }
  
  if (hour !== '*' && minute !== '*') {
    return { type: 'daily', hour: parseInt(hour) || 9, minute: parseInt(minute) || 0, weekday: 1, custom: cron }
  }
  
  return { type: 'custom', hour: 9, minute: 0, weekday: 1, custom: cron }
}

export default function Cron() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newJob, setNewJob] = useState({ name: '', message: '' })
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    type: 'daily',
    hour: 9,
    minute: 0,
    weekday: 1,
    custom: ''
  })

  const weekdays = [
    t.cron.sunday,
    t.cron.monday,
    t.cron.tuesday,
    t.cron.wednesday,
    t.cron.thursday,
    t.cron.friday,
    t.cron.saturday,
  ]

  function scheduleToHuman(config: ScheduleConfig): string {
    const hourStr = config.hour.toString().padStart(2, '0')
    const minStr = config.minute.toString().padStart(2, '0')
    
    switch (config.type) {
      case 'hourly':
        return `${t.cron.everyHourAt} ${config.minute}`
      case 'daily':
        return `${t.cron.everyDayAt} ${hourStr}:${minStr}`
      case 'weekly':
        return `${t.cron.everyWeekAt}${weekdays[config.weekday]} ${hourStr}:${minStr}`
      case 'custom':
        return config.custom
      default:
        return ''
    }
  }

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.getCronJobs()
        setJobs(res.jobs)
      } catch (error) {
        console.error('Failed to fetch cron jobs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const handleCreateJob = async () => {
    if (!newJob.name || !newJob.message) return
    try {
      const schedule = scheduleToCron(scheduleConfig)
      await api.createCronJob({ name: newJob.name, schedule, message: newJob.message })
      const res = await api.getCronJobs()
      setJobs(res.jobs)
      setShowModal(false)
      setNewJob({ name: '', message: '' })
      setScheduleConfig({ type: 'daily', hour: 9, minute: 0, weekday: 1, custom: '' })
    } catch (error) {
      console.error('Failed to create job:', error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      await api.deleteCronJob(jobId)
      setJobs((prev) => prev.filter((j) => j.id !== jobId))
    } catch (error) {
      console.error('Failed to delete job:', error)
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.cron.title}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>{t.cron.addTask}</span>
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm text-center">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t.cron.noTasks}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {t.cron.createTask}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.cron.name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.cron.schedule}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.cron.nextRun}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.cron.status}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.cron.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{job.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {scheduleToHuman(cronToSchedule(job.schedule))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {job.next_run || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs',
                        job.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      )}
                    >
                      {job.enabled ? t.channels.enabled : t.channels.disabled}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className={clsx(
                          'p-2 rounded-lg transition-colors',
                          job.enabled
                            ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600'
                            : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600'
                        )}
                      >
                        {job.enabled ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t.cron.createTaskTitle}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.cron.name}
                </label>
                <input
                  type="text"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Daily Summary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.cron.repeat}
                </label>
                <select
                  value={scheduleConfig.type}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, type: e.target.value as ScheduleType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="daily">{t.cron.everyDay}</option>
                  <option value="hourly">{t.cron.everyHour}</option>
                  <option value="weekly">{t.cron.everyWeek}</option>
                  <option value="custom">{t.cron.custom}</option>
                </select>
              </div>

              {scheduleConfig.type === 'hourly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.cron.minute}
                  </label>
                  <select
                    value={scheduleConfig.minute}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, minute: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              )}

              {(scheduleConfig.type === 'daily' || scheduleConfig.type === 'weekly') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.cron.hour}
                    </label>
                    <select
                      value={scheduleConfig.hour}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, hour: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.cron.minute}
                    </label>
                    <select
                      value={scheduleConfig.minute}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, minute: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {scheduleConfig.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.cron.dayOfWeek}
                  </label>
                  <select
                    value={scheduleConfig.weekday}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, weekday: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {weekdays.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {scheduleConfig.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.cron.cronExpression}
                  </label>
                  <input
                    type="text"
                    value={scheduleConfig.custom}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, custom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0 9 * * *"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.cron.cronFormat}</p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{t.cron.schedulePreview}: </span>
                  {scheduleToHuman(scheduleConfig)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.cron.message}
                </label>
                <textarea
                  value={newJob.message}
                  onChange={(e) => setNewJob({ ...newJob, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Summarize today's activities"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleCreateJob}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                >
                  {t.common.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
