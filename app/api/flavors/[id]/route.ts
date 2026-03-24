import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('humor_flavors')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = { modified_by_user_id: user!.id }

  if (body.slug !== undefined) updates.slug = body.slug
  if (body.description !== undefined) updates.description = body.description

  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('humor_flavors')
    .update(updates)
    .eq('id', Number(id))
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const admin = createAdminClient()
  const { error: dbError } = await admin
    .from('humor_flavors')
    .delete()
    .eq('id', Number(id))

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
