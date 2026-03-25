import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { error, userId } = await requireAdmin()
  if (error) return error

  const { stepId } = await params
  const body = await request.json()

  const allowed = [
    'humor_flavor_step_type_id',
    'llm_input_type_id',
    'llm_model_id',
    'llm_temperature',
    'description',
  ]

  const updates: Record<string, unknown> = { modified_by_user_id: userId }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('humor_flavor_steps')
    .update(updates)
    .eq('id', Number(stepId))
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { error, userId } = await requireAdmin()
  if (error) return error

  const { id, stepId } = await params
  const admin = createAdminClient()

  // Delete the step
  const { error: dbError } = await admin
    .from('humor_flavor_steps')
    .delete()
    .eq('id', Number(stepId))

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Reorder remaining steps
  const { data: remaining } = await admin
    .from('humor_flavor_steps')
    .select('id')
    .eq('humor_flavor_id', Number(id))
    .order('order_by', { ascending: true })

  if (remaining && remaining.length > 0) {
    await Promise.all(
      remaining.map((step, index) =>
        admin
          .from('humor_flavor_steps')
          .update({ order_by: index + 1, modified_by_user_id: userId })
          .eq('id', step.id)
      )
    )
  }

  return NextResponse.json({ success: true })
}
