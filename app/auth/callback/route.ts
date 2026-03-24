import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // No code means no valid OAuth flow — send to login
  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`)
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError || !user) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`)
    }

    // Check superadmin OR matrix_admin — if this throws, the catch signs the user out
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

    return NextResponse.redirect(`${requestUrl.origin}/flavors`)
  } catch {
    // Any unexpected error — sign out any partial session and send to login
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {}
    return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`)
  }
}
