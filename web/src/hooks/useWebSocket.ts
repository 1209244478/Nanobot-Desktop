import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'

const BACKEND_PORT = 18790
const WS_URL = `ws://localhost:${BACKEND_PORT}/ws/chat`

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number>()
  const isConnectingRef = useRef(false)
  const { 
    addMessage, 
    updateMessage, 
    setConnected, 
    setTyping,
    currentSessionId,
    sessions,
    createSession,
    setCurrentSession,
    refreshSessions,
  } = useChatStore()

  const currentSessionIdRef = useRef(currentSessionId)
  const addMessageRef = useRef(addMessage)
  const updateMessageRef = useRef(updateMessage)
  const setTypingRef = useRef(setTyping)
  const sessionsRef = useRef(sessions)
  const createSessionRef = useRef(createSession)
  const setCurrentSessionRef = useRef(setCurrentSession)
  const refreshSessionsRef = useRef(refreshSessions)

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId
    addMessageRef.current = addMessage
    updateMessageRef.current = updateMessage
    setTypingRef.current = setTyping
    sessionsRef.current = sessions
    createSessionRef.current = createSession
    setCurrentSessionRef.current = setCurrentSession
    refreshSessionsRef.current = refreshSessions
  }, [currentSessionId, addMessage, updateMessage, setTyping, sessions, createSession, setCurrentSession, refreshSessions])

  const handleMessage = useCallback((data: any) => {
    let sessionId = currentSessionIdRef.current
    console.log('handleMessage called with sessionId:', sessionId, 'data:', data)

    if (data.session_id) {
      const backendSessionId = data.session_id
      
      if (!sessionId) {
        const existingSession = sessionsRef.current.find(s => s.id === backendSessionId)
        if (existingSession) {
          sessionId = backendSessionId
          setCurrentSessionRef.current(backendSessionId)
        } else {
          const newId = createSessionRef.current()
          sessionId = newId
        }
        currentSessionIdRef.current = sessionId
      }
    }

    if (!sessionId) {
      console.log('No sessionId, skipping message')
      return
    }

    switch (data.type) {
      case 'message':
        addMessageRef.current(sessionId, {
          id: data.id,
          role: data.role,
          content: data.content ?? '',
          timestamp: new Date(data.timestamp),
          status: 'done',
        })
        break

      case 'stream_start':
        setTypingRef.current(true)
        addMessageRef.current(sessionId, {
          id: data.id,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          status: 'streaming',
        })
        break

      case 'stream_chunk':
        updateMessageRef.current(sessionId, data.id, typeof data.content === 'string' ? data.content : '', 'streaming')
        break

      case 'stream_end':
        setTypingRef.current(false)
        updateMessageRef.current(sessionId, data.id, typeof data.content === 'string' ? data.content : '', 'done')
        break

      case 'external_message':
        const sessionKey = data.session_key
        if (sessionKey) {
          if (!sessionsRef.current.find((s: any) => s.key === sessionKey)) {
            createSessionRef.current(sessionKey)
          }
          if (data.user_message) {
            addMessageRef.current(sessionKey, {
              id: `ext-user-${Date.now()}`,
              role: 'user',
              content: data.user_message,
              timestamp: new Date(),
              status: 'done',
            })
          }
          addMessageRef.current(sessionKey, {
            id: `ext-${Date.now()}`,
            role: 'assistant',
            content: data.content,
            timestamp: new Date(),
            status: 'done',
          })
          refreshSessionsRef.current()
        }
        break

      case 'error':
        setTypingRef.current(false)
        if (data.message_id) {
          updateMessageRef.current(sessionId, data.message_id, String(data.error || 'Unknown error'), 'error')
        }
        break
    }
  }, [])

  const connect = useCallback(() => {
    if (isConnectingRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

    isConnectingRef.current = true
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
      isConnectingRef.current = false
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
      isConnectingRef.current = false
      wsRef.current = null
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnectingRef.current = false
    }

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data)
      try {
        const data = JSON.parse(event.data)
        console.log('Parsed message:', data)
        handleMessage(data)
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }
  }, [setConnected, handleMessage])

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return false
    }

    const message = {
      type: 'chat',
      content,
      session_id: currentSessionIdRef.current,
    }
    console.log('Sending message:', message)
    wsRef.current.send(JSON.stringify(message))
    return true
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
      isConnectingRef.current = false
    }
  }, [])

  return { sendMessage, isConnected: useChatStore((s) => s.isConnected) }
}
