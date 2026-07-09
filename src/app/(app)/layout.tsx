import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const meta = user.user_metadata ?? {}
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: meta.full_name ?? meta.name ?? '',
    }, { onConflict: 'id', ignoreDuplicates: true })
  }

  return (
    <div className="flex h-screen bg-surface-page">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pt-14 lg:pt-0">
        <div className="max-w-[1280px] mx-auto px-4 py-5 lg:px-6 lg:py-6 lg:h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
