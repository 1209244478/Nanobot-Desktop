import { useEffect, useCallback, useState } from 'react'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ChatInput from '../components/ChatInput'
import { MessageList } from '../components/MessageBubble'
import { useChatStore } from '../store/chatStore'
import { useWebSocket } from '../hooks/useWebSocket'
import clsx from 'clsx'

let messageIdCounter = 0

export default function Chat() {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    addMessage, 
    isTyping,
    isLoading,
    loadSessions,
    loadSession,
  } = useChatStore()
  const { sendMessage, isConnected } = useWebSocket()
  const [backendReady, setBackendReady] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)

  const currentSession = sessions.find((s) => s.id === currentSessionId)

  useEffect(() => {
    if (currentSessionId && currentSession && currentSession.messages.length === 0) {
      loadSession(currentSessionId)
    }
  }, [currentSessionId, currentSession, loadSession])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.isBackendReady().then((ready: boolean) => {
        if (ready) {
          setBackendReady(true)
          loadSessions()
        }
      })
      
      const unsubscribeReady = window.electronAPI.onBackendReady(() => {
        setBackendReady(true)
        setBackendError(null)
        loadSessions()
      })
      
      const unsubscribeError = window.electronAPI.onBackendError((error: string) => {
        setBackendError(error)
      })
      
      return () => {
        unsubscribeReady()
        unsubscribeError()
      }
    } else {
      setBackendReady(true)
      loadSessions()
    }
  }, [loadSessions])

  const handleSend = useCallback((content: string) => {
    let sessionId = currentSessionId
    
    if (!sessionId) {
      sessionId = createSession()
    }

    const userMessageId = `msg-${++messageIdCounter}`
    addMessage(sessionId, {
      id: userMessageId,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'done',
    })

    sendMessage(content)
  }, [currentSessionId, createSession, addMessage, sendMessage])

  if (!backendReady) {
    return (
      <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary-500" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {backendError ? 'Backend Error' : 'Starting Backend...'}
          </p>
          {backendError && (
            <p className="text-sm text-red-500 mt-2 max-w-md">{backendError}</p>
          )}
          {!backendError && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please wait while the backend initializes
            </p>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] flex rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {currentSession?.title || 'New Chat'}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isConnected ? (
              <Wifi size={16} className="text-green-500" />
            ) : (
              <WifiOff size={16} className="text-red-500" />
            )}
            <span
              className={clsx(
                'text-xs',
                isConnected ? 'text-green-500' : 'text-red-500'
              )}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <MessageList messages={currentSession?.messages || []} />

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <ChatInput
            onSend={handleSend}
            disabled={!isConnected || isTyping}
            placeholder={
              !isConnected
                ? 'Connecting...'
                : isTyping
                ? 'Waiting for response...'
                : 'Type a message...'
            }
          />
        </div>
      </div>
    </div>
  )
}
