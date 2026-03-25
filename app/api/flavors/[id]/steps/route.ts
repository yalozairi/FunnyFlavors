import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('humor_flavor_steps')
    .select('*')
    .eq('humor_flavor_id', Number(id))
    .order('order_by', { ascending: true })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, userId } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  // Determine next order_by value
  const { data: existingSteps } = await admin
    .from('humor_flavor_steps')
    .select('order_by')
    .eq('humor_flavor_id', Number(id))
    .order('order_by', { ascending: false })
    .limit(1)

  const nextOrder = existingSteps && existingSteps.length > 0
    ? (existingSteps[0].order_by + 1)
    : 1

  const { data, error: dbError } = await admin
    .from('humor_flavor_steps')
    .insert({
      humor_flavor_id: Number(id),
      order_by: nextOrder,
      humor_flavor_step_type_id: body.humor_flavor_step_type_id ?? null,
      llm_input_type_id: body.llm_input_type_id ?? null,
      llm_model_id: body.llm_model_id ?? null,
      llm_temperature: body.llm_temperature ?? 0.7,
      description: body.description ?? null,
      created_by_user_id: userId,
      modified_by_user_id: userId,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
