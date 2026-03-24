import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../auth-check'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get('limit') ?? 20)

  const admin = createAdminClient()
  const { data, error: dbError } = await admin
    .from('captions')
    .select('id, content, created_datetime_utc, images(id, url)')
    .eq('humor_flavor_id', Number(id))
    .order('created_datetime_utc', { ascending: false })
    .limit(limit)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
