'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function AuthThemeToggle() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const savedTheme =
      (typeof window !== 'undefined' && window.localStorage.getItem('theme')) ||
      document.documentElement.getAttribute('data-theme') ||
      'dark'
    setTheme(savedTheme)
  }, [])

  const handleToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(nextTheme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', nextTheme)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm hover:border-[#FF6700]/70 transition"
    >
      {theme === 'dark' ? <Moon size={16} className="text-[#FF6700]" /> : <Sun size={16} className="text-[#FF6700]" />}
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
