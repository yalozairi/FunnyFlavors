export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function FlavorsPage() {
  const admin = createAdminClient()
  const { data: flavors, error } = await admin
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc')
    .order('id', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Humor Flavors</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {flavors?.length ?? 0} flavor{(flavors?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/flavors/new"
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          + New Flavor
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300 mb-6 text-sm">
          {error.message}
        </div>
      )}

      <div className="grid gap-4">
        {(flavors ?? []).map((flavor) => (
          <div
            key={flavor.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">#{flavor.id}</span>
                  <span className="text-sm font-mono bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                    {flavor.slug}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-2">
                  {flavor.description ?? 'No description'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                  Created {new Date(flavor.created_datetime_utc).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/flavors/${flavor.id}/test`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/50 transition-colors"
                >
                  Test
                </Link>
                <Link
                  href={`/flavors/${flavor.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Manage
                </Link>
              </div>
            </div>
          </div>
        ))}

        {(flavors ?? []).length === 0 && !error && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600">
            <p className="text-4xl mb-3">🌶️</p>
            <p className="font-medium">No humor flavors yet</p>
            <p className="text-sm mt-1">Create your first flavor to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
