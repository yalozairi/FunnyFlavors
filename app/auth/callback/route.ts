import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (!user) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`)
    }

    // Check superadmin OR matrix_admin using service-role client (bypasses RLS)
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_superadmin, is_matrix_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/login?error=unauthorized`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/flavors`)
}
