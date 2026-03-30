import { create } from 'zustand'
import { api } from '../services/api'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string | unknown[]
  timestamp: Date
  status?: 'pending' | 'streaming' | 'done' | 'error'
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  isConnected: boolean
  isTyping: boolean
  isLoading: boolean

  createSession: (sessionId?: string) => string
  deleteSession: (id: string) => void
  setCurrentSession: (id: string) => void
  addMessage: (sessionId: string, message: Message) => void
  updateMessage: (sessionId: string, messageId: string, content: string | unknown[], status?: Message['status']) => void
  setConnected: (connected: boolean) => void
  setTyping: (typing: boolean) => void
  clearSession: (sessionId: string) => void
  loadSessions: () => Promise<void>
  loadSession: (id: string) => Promise<void>
  setSessions: (sessions: ChatSession[]) => void
  refreshSessions: () => Promise<void>
}

let sessionIdCounter = 0

function generateSessionId(): string {
  const timestamp = Date.now()
  return `web_${timestamp}`
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isConnected: false,
  isTyping: false,
  isLoading: false,

  createSession: (sessionId?: string) => {
    sessionIdCounter++
    const id = sessionId || generateSessionId()
    const session: ChatSession = {
      id,
      title: sessionId ? sessionId : `Chat ${sessionIdCounter}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => {
      const exists = state.sessions.find(s => s.id === id)
      if (exists) {
        return { currentSessionId: id }
      }
      return {
        sessions: [session, ...state.sessions],
        currentSessionId: id,
      }
    })
    return id
  },

  deleteSession: (id) => {
    api.deleteSession(id).catch(console.error)
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id)
      const currentSessionId = state.currentSessionId === id
        ? sessions[0]?.id || null
        : state.currentSessionId
      return { sessions, currentSessionId }
    })
  },

  setCurrentSession: (id) => {
    set({ currentSessionId: id })
  },

  addMessage: (sessionId, message) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              updatedAt: new Date(),
            }
          : s
      ),
    }))
  },

  updateMessage: (sessionId, messageId, content, status) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId
                  ? { ...m, content, status: status || m.status }
                  : m
              ),
              updatedAt: new Date(),
            }
          : s
      ),
    }))
  },

  setConnected: (connected) => {
    set({ isConnected: connected })
  },

  setTyping: (typing) => {
    set({ isTyping: typing })
  },

  clearSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [], updatedAt: new Date() }
          : s
      ),
    }))
  },

  loadSessions: async () => {
    set({ isLoading: true })
    try {
      const res = await api.getSessions()
      const backendSessions: ChatSession[] = res.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        messages: [],
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      }))
      
      set((state) => {
        const sessionMap = new Map<string, ChatSession>()
        
        state.sessions.forEach(s => {
          sessionMap.set(s.id, s)
        })
        
        backendSessions.forEach(backend => {
          const existing = sessionMap.get(backend.id)
          if (!existing || existing.messages.length === 0) {
            sessionMap.set(backend.id, backend)
          }
        })
        
        const allSessions = Array.from(sessionMap.values())
        
        return { 
          sessions: allSessions, 
          isLoading: false,
          currentSessionId: state.currentSessionId || (allSessions.length > 0 ? allSessions[0].id : null)
        }
      })
    } catch (error) {
      console.error('Failed to load sessions:', error)
      set({ isLoading: false })
      if (!get().currentSessionId) {
        get().createSession()
      }
    }
  },

  loadSession: async (id: string) => {
    try {
      const res = await api.getSession(id)
      const messages: Message[] = res.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content ?? '',
        timestamp: new Date(m.timestamp),
        status: 'done' as const,
      }))
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id
            ? { ...s, messages }
            : s
        ),
      }))
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  },

  setSessions: (sessions) => {
    set({ sessions })
  },

  refreshSessions: async () => {
    try {
      const res = await api.getSessions()
      const backendSessions: ChatSession[] = res.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        messages: [],
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      }))
      
      set((state) => {
        const sessionMap = new Map<string, ChatSession>()
        
        state.sessions.forEach(s => {
          sessionMap.set(s.id, s)
        })
        
        backendSessions.forEach(backend => {
          const existing = sessionMap.get(backend.id)
          if (!existing || existing.messages.length === 0) {
            sessionMap.set(backend.id, backend)
          }
        })
        
        return { sessions: Array.from(sessionMap.values()) }
      })
    } catch (error) {
      console.error('Failed to refresh sessions:', error)
    }
  },
}))
