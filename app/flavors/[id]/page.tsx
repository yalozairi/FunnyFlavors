export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FlavorEditor from './_components/FlavorEditor'
import StepsManager from './_components/StepsManager'

export default async function FlavorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [flavorRes, stepsRes, modelsRes, stepTypesRes, inputTypesRes] = await Promise.all([
    admin.from('humor_flavors').select('*').eq('id', Number(id)).single(),
    admin.from('humor_flavor_steps')
      .select('*')
      .eq('humor_flavor_id', Number(id))
      .order('order_by', { ascending: true }),
    admin.from('llm_models').select('id, name').order('name'),
    admin.from('humor_flavor_step_types').select('id, slug, description').order('slug'),
    admin.from('llm_input_types').select('id, slug, description').order('slug'),
  ])

  if (flavorRes.error || !flavorRes.data) {
    notFound()
  }

  const flavor = flavorRes.data
  const steps = stepsRes.data ?? []
  const models = modelsRes.data ?? []
  const stepTypes = stepTypesRes.data ?? []
  const inputTypes = inputTypesRes.data ?? []

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Link href="/flavors" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            ← Back to flavors
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{flavor.slug}</h1>
            <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">#{flavor.id}</span>
          </div>
        </div>
        <Link
          href={`/flavors/${id}/test`}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          Test Flavor
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <FlavorEditor flavor={flavor} />
        <StepsManager
          flavorId={Number(id)}
          steps={steps}
          models={models}
          stepTypes={stepTypes}
          inputTypes={inputTypes}
        />
      </div>
    </div>
  )
}
