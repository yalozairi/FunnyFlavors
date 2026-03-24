import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Navbar from '@/components/Navbar'

export default async function FlavorsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify superadmin or matrix_admin status — deny on any failure
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_superadmin, is_matrix_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
      await supabase.auth.signOut()
      redirect('/login?error=unauthorized')
    }
  } catch {
    await supabase.auth.signOut()
    redirect('/login?error=unauthorized')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar userEmail={user.email ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
