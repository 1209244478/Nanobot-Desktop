const BACKEND_PORT = 18790;
const API_BASE = `http://localhost:${BACKEND_PORT}/api`;

export interface Status {
  status: string
  version: string
  connected_clients: number
}

export interface Channel {
  id: string
  name: string
  enabled: boolean
  status: string
}

export interface Provider {
  id: string
  name: string
  configured: boolean
  model: string
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  enabled: boolean
  next_run: string | null
}

export interface Config {
  agents: {
    defaults: {
      model: string
      max_tokens: number
      temperature: number
      context_window_tokens: number
    }
  }
  gateway: {
    host: string
    port: number
    heartbeat: {
      enabled: boolean
      interval_s: number
    }
  }
  tools: {
    web: {
      search: {
        provider: string
        max_results: number
      }
      proxy: string | null
    }
    exec: {
      timeout: number
    }
    restrict_to_workspace: boolean
  }
  channels: Record<string, { enabled: boolean }>
  providers: Record<string, { api_key?: string; model?: string; api_base?: string }>
}

export interface SessionInfo {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
  }>
}

export interface Skill {
  id: string
  name: string
  description: string
  source: 'builtin' | 'workspace'
  available: boolean
  emoji: string
  requires: {
    bins: string[]
    env: string[]
  }
  missing: {
    bins: string[]
    env: string[]
  }
}

export interface SkillDetail {
  id: string
  name: string
  description: string
  content: string
  emoji?: string
}

export interface SkillHubResult {
  slug: string
  name: string
  description: string
  version: string
}

export const api = {
  async getStatus(): Promise<Status> {
    const res = await fetch(`${API_BASE}/status`)
    return res.json()
  },

  async getChannels(): Promise<{ channels: Channel[] }> {
    const res = await fetch(`${API_BASE}/channels`)
    return res.json()
  },

  async getProviders(): Promise<{ providers: Provider[] }> {
    const res = await fetch(`${API_BASE}/providers`)
    return res.json()
  },

  async getCronJobs(): Promise<{ jobs: CronJob[] }> {
    const res = await fetch(`${API_BASE}/cron`)
    return res.json()
  },

  async createCronJob(job: { name: string; schedule: string; message: string }): Promise<void> {
    await fetch(`${API_BASE}/cron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    })
  },

  async deleteCronJob(jobId: string): Promise<void> {
    await fetch(`${API_BASE}/cron/${jobId}`, { method: 'DELETE' })
  },

  async getConfig(): Promise<Config> {
    const res = await fetch(`${API_BASE}/config`)
    return res.json()
  },

  async updateConfig(config: Partial<Config>): Promise<void> {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to update config')
    }
  },

  async getSessions(): Promise<{ sessions: SessionInfo[] }> {
    const res = await fetch(`${API_BASE}/sessions`)
    return res.json()
  },

  async getSession(key: string): Promise<Session> {
    const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(key)}`)
    return res.json()
  },

  async deleteSession(key: string): Promise<void> {
    await fetch(`${API_BASE}/sessions/${encodeURIComponent(key)}`, { method: 'DELETE' })
  },

  async reloadChannel(name: string): Promise<void> {
    await fetch(`${API_BASE}/channels/${name}/reload`, { method: 'POST' })
  },

  async getSkills(): Promise<{ skills: Skill[] }> {
    const res = await fetch(`${API_BASE}/skills`)
    return res.json()
  },

  async getSkill(name: string): Promise<SkillDetail> {
    const res = await fetch(`${API_BASE}/skills/${name}`)
    return res.json()
  },

  async searchSkillHub(query: string): Promise<{ results: SkillHubResult[]; query: string }> {
    const res = await fetch(`${API_BASE}/skillhub/search?q=${encodeURIComponent(query)}`)
    return res.json()
  },

  async installSkillHub(slug: string): Promise<{ status: string; slug: string; path: string }> {
    const res = await fetch(`${API_BASE}/skillhub/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    return res.json()
  },

  async deleteSkill(name: string): Promise<void> {
    await fetch(`${API_BASE}/skills/${name}`, { method: 'DELETE' })
  },
}
