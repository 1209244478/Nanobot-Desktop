import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({ 
  onSend, 
  disabled = false, 
  placeholder = 'Type a message...' 
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || disabled) return

    onSend(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={clsx(
            'w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800 px-4 py-3 pr-12',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'text-gray-900 dark:text-white',
            'scrollbar-thin',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className={clsx(
          'p-3 rounded-xl transition-colors',
          'bg-primary-500 hover:bg-primary-600 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
        )}
      >
        {disabled ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Send size={20} />
        )}
      </button>
    </form>
  )
}
