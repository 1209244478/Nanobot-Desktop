import { useState } from 'react'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import clsx from 'clsx'
import { useChatStore } from '../store/chatStore'

export default function Sidebar() {
  const { sessions, currentSessionId, createSession, deleteSession, setCurrentSession } = useChatStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleNewChat = () => {
    createSession()
  }

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      <div className="p-4 flex-shrink-0">
        <button
          onClick={handleNewChat}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
            'bg-primary-500 hover:bg-primary-600 text-white transition-colors'
          )}
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
        <div className="px-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onMouseEnter={() => setHoveredId(session.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setCurrentSession(session.id)}
              className={clsx(
                'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer',
                'transition-colors',
                currentSessionId === session.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{session.title}</span>
              {hoveredId === session.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
