'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-32 h-9" />

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          theme === 'light'
            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          theme === 'system'
            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        System
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          theme === 'dark'
            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        Dark
      </button>
    </div>
  )
}
