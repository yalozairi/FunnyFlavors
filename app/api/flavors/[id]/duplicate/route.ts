import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

type FlavorRow = {
  id: number
  slug: string
  description: string | null
}

type StepRow = {
  order_by: number
  humor_flavor_step_type_id: number | null
  llm_input_type_id: number | null
  llm_output_type_id: number | null
  llm_model_id: number | null
  llm_temperature: number | null
  description: string | null
  llm_system_prompt: string | null
  llm_user_prompt: string | null
}

function buildCandidateSlug(baseSlug: string, suffixNumber: number) {
  return suffixNumber === 0 ? `${baseSlug}-copy` : `${baseSlug}-copy-${suffixNumber + 1}`
}

async function buildUniqueSlug(admin: ReturnType<typeof createAdminClient>, baseSlug: string) {
  const { data, error } = await admin
    .from('humor_flavors')
    .select('slug')
    .ilike('slug', `${baseSlug}-copy%`)

  if (error) {
    throw new Error(error.message)
  }

  const existing = new Set((data ?? []).map((row) => row.slug))
  let suffixNumber = 0

  while (existing.has(buildCandidateSlug(baseSlug, suffixNumber))) {
    suffixNumber += 1
  }

  return buildCandidateSlug(baseSlug, suffixNumber)
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const flavorId = Number(id)
  const admin = createAdminClient()

  const { data: flavor, error: flavorError } = await admin
    .from('humor_flavors')
    .select('id, slug, description')
    .eq('id', flavorId)
    .single<FlavorRow>()

  if (flavorError || !flavor) {
    return NextResponse.json({ error: flavorError?.message ?? 'Flavor not found' }, { status: 404 })
  }

  const { data: steps, error: stepsError } = await admin
    .from('humor_flavor_steps')
    .select(`
      order_by,
      humor_flavor_step_type_id,
      llm_input_type_id,
      llm_output_type_id,
      llm_model_id,
      llm_temperature,
      description,
      llm_system_prompt,
      llm_user_prompt
    `)
    .eq('humor_flavor_id', flavorId)
    .order('order_by', { ascending: true })
    .returns<StepRow[]>()

  if (stepsError) {
    return NextResponse.json({ error: stepsError.message }, { status: 500 })
  }

  try {
    const uniqueSlug = await buildUniqueSlug(admin, flavor.slug)

    const { data: duplicateFlavor, error: duplicateFlavorError } = await admin
      .from('humor_flavors')
      .insert({
        slug: uniqueSlug,
        description: flavor.description,
        created_by_user_id: userId,
        modified_by_user_id: userId,
      })
      .select('id, slug')
      .single<{ id: number; slug: string }>()

    if (duplicateFlavorError || !duplicateFlavor) {
      return NextResponse.json(
        { error: duplicateFlavorError?.message ?? 'Failed to duplicate flavor' },
        { status: 500 }
      )
    }

    if ((steps ?? []).length > 0) {
      const { error: duplicateStepsError } = await admin
        .from('humor_flavor_steps')
        .insert(
          steps.map((step) => ({
            humor_flavor_id: duplicateFlavor.id,
            order_by: step.order_by,
            humor_flavor_step_type_id: step.humor_flavor_step_type_id,
            llm_input_type_id: step.llm_input_type_id,
            llm_output_type_id: step.llm_output_type_id,
            llm_model_id: step.llm_model_id,
            llm_temperature: step.llm_temperature,
            description: step.description,
            llm_system_prompt: step.llm_system_prompt,
            llm_user_prompt: step.llm_user_prompt,
            created_by_user_id: userId,
            modified_by_user_id: userId,
          }))
        )

      if (duplicateStepsError) {
        await admin.from('humor_flavors').delete().eq('id', duplicateFlavor.id)
        return NextResponse.json({ error: duplicateStepsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ id: duplicateFlavor.id, slug: duplicateFlavor.slug }, { status: 201 })
  } catch (duplicateError) {
    return NextResponse.json(
      { error: duplicateError instanceof Error ? duplicateError.message : 'Failed to duplicate flavor' },
      { status: 500 }
    )
  }
}
