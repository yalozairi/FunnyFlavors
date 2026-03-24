import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('humor_flavors')
    .select('*')
    .order('id')

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { slug, description } = body

  if (!slug || !description) {
    return NextResponse.json({ error: 'slug and description are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('humor_flavors')
    .insert({
      slug,
      description,
      created_by_user_id: user!.id,
      modified_by_user_id: user!.id,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
