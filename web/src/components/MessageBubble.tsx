import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { User, Bot, AlertCircle, FileAudio, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Message } from '../store/chatStore'

interface MessageBubbleProps {
  message: Message
  defaultCollapsed?: boolean
}

interface MediaItem {
  type: 'voice' | 'image'
  path: string
  url: string
}

function parseMediaContent(content: string | undefined | null | unknown[]): { text: string; media: MediaItem[] } {
  const media: MediaItem[] = []
  
  if (!content) {
    return { text: '', media }
  }
  
  if (Array.isArray(content)) {
    let text = ''
    for (const item of content) {
      if (typeof item === 'string') {
        text += item + ' '
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        if (obj.type === 'text' && typeof obj.text === 'string') {
          text += obj.text + ' '
        }
      }
    }
    const result = extractMediaFromText(text.trim())
    return { text: result.text, media: result.media }
  }
  
  if (typeof content !== 'string') {
    return { text: '', media }
  }
  
  return extractMediaFromText(content)
}

function extractMediaFromText(content: string): { text: string; media: MediaItem[] } {
  const media: MediaItem[] = []
  const voiceRegex = /\[voice:\s*([^\]]+)\]/gi
  const imageRegex = /\[image:\s*([^\]]+)\]/gi
  
  let text = String(content)
  
  let match
  while ((match = voiceRegex.exec(content)) !== null) {
    const filePath = String(match[1]).trim()
    const mediaPath = convertPathToUrl(filePath)
    media.push({ type: 'voice', path: filePath, url: `/media/${mediaPath}` })
    text = text.replace(match[0], '')
  }
  
  while ((match = imageRegex.exec(content)) !== null) {
    const filePath = String(match[1]).trim()
    const mediaPath = convertPathToUrl(filePath)
    media.push({ type: 'image', path: filePath, url: `/media/${mediaPath}` })
    text = text.replace(match[0], '')
  }
  
  return { text: text.trim(), media }
}

function convertPathToUrl(filePath: string): string {
  if (typeof filePath !== 'string') return ''
  const normalizedPath = filePath.replace(/\\/g, '/')
  const mediaIndex = normalizedPath.indexOf('.nanobot/media/')
  if (mediaIndex !== -1) {
    return normalizedPath.substring(mediaIndex + '.nanobot/media/'.length)
  }
  const altMediaIndex = normalizedPath.indexOf('/media/')
  if (altMediaIndex !== -1) {
    return normalizedPath.substring(altMediaIndex + '/media/'.length)
  }
  return normalizedPath
}

function MediaRenderer({ media }: { media: { type: 'voice' | 'image'; path: string; url: string }[] }) {
  if (media.length === 0) return null
  
  return (
    <div className="mt-2 space-y-2">
      {media.map((item, index) => (
        <div key={index} className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
          {item.type === 'voice' ? (
            <div className="flex items-center gap-2 p-2">
              <FileAudio size={20} className="text-primary-500 flex-shrink-0" />
              <audio controls className="flex-1 h-8 max-w-full">
                <source src={item.url} type="audio/ogg" />
                <source src={item.url} type="audio/mpeg" />
                <source src={item.url} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <div className="p-2">
              <img
                src={item.url}
                alt="Shared image"
                className="max-w-full max-h-64 rounded object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.innerHTML = `
                    <div class="flex items-center gap-2 text-gray-500 p-2">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span class="text-sm">Image not found</span>
                    </div>
                  `
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function MessageBubble({ message, defaultCollapsed = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isError = message.status === 'error'
  const isStreaming = message.status === 'streaming'
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  
  const { text, media } = parseMediaContent(message.content || '')

  return (
    <div
      className={clsx(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-gray-800',
        isError && 'border border-red-200 dark:border-red-800'
      )}
    >
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        )}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {!isUser && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronRight size={14} className="text-gray-500" />
              ) : (
                <ChevronDown size={14} className="text-gray-500" />
              )}
            </button>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {isUser ? 'You' : 'nanobot'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {message.timestamp.toLocaleTimeString()}
          </span>
          {isError && <AlertCircle size={14} className="text-red-500" />}
        </div>

        {(!collapsed || isUser) && (
          <>
            <div
              className={clsx(
                'prose prose-sm dark:prose-invert max-w-none',
                isError && 'text-red-600 dark:text-red-400'
              )}
            >
              {text ? (
                <ReactMarkdown>{text}</ReactMarkdown>
              ) : media.length > 0 ? null : isStreaming ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  <span className="text-gray-400">Thinking...</span>
                </div>
              ) : null}
            </div>
            
            <MediaRenderer media={media} />
          </>
        )}
        
        {collapsed && !isUser && text && (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
            {text.substring(0, 100)}{text.length > 100 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

export function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getCollapsedState = (index: number, messages: Message[]): boolean => {
    if (messages[index].role !== 'assistant') return false
    
    let nextAssistantIndex = -1
    for (let i = index + 1; i < messages.length; i++) {
      if (messages[i].role === 'assistant') {
        nextAssistantIndex = i
        break
      }
    }
    
    return nextAssistantIndex !== -1
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <span className="text-4xl mb-4">🐈</span>
          <p className="text-lg">Start a conversation with nanobot</p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              defaultCollapsed={getCollapsedState(index, messages)}
            />
          ))}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  )
}
