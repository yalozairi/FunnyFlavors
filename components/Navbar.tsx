'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/flavors"
            className="text-lg font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2"
          >
            <span>🌶️</span>
            <span>Funny Flavors</span>
          </Link>
          <Link
            href="/flavors"
            className={`text-sm font-medium transition-colors ${
              pathname === '/flavors'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Flavors
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-xs text-slate-500 dark:text-slate-500 hidden sm:block truncate max-w-40">
            {userEmail}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
