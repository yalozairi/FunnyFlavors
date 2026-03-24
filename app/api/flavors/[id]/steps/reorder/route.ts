import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const { stepId, direction } = body

  if (!stepId || !['up', 'down'].includes(direction)) {
    return NextResponse.json({ error: 'stepId and direction (up|down) are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get all steps for this flavor ordered by order_by
  const { data: steps, error: fetchError } = await admin
    .from('humor_flavor_steps')
    .select('id, order_by')
    .eq('humor_flavor_id', Number(id))
    .order('order_by', { ascending: true })

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!steps) return NextResponse.json({ error: 'No steps found' }, { status: 404 })

  const currentIndex = steps.findIndex((s) => s.id === stepId)
  if (currentIndex === -1) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (swapIndex < 0 || swapIndex >= steps.length) {
    return NextResponse.json({ error: 'Cannot move further' }, { status: 400 })
  }

  const current = steps[currentIndex]
  const swap = steps[swapIndex]

  // Swap order_by values
  await Promise.all([
    admin.from('humor_flavor_steps').update({ order_by: swap.order_by }).eq('id', current.id),
    admin.from('humor_flavor_steps').update({ order_by: current.order_by }).eq('id', swap.id),
  ])

  return NextResponse.json({ success: true })
}
