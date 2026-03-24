import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from './login-button'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/flavors')

  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-950 dark:to-slate-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm flex flex-col items-center gap-8 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🌶️</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Funny Flavors</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Prompt chain tool — admin access only
          </p>
        </div>

        {error && (
          <div className="w-full bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm text-center">
            {error === 'unauthorized'
              ? 'Your account does not have admin privileges.'
              : 'Authentication failed. Please try again.'}
          </div>
        )}

        <div className="w-full">
          <LoginButton />
        </div>

        <p className="text-slate-400 dark:text-slate-600 text-xs text-center">
          Requires superadmin or matrix admin account
        </p>
      </div>
    </div>
  )
}
