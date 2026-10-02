import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { requireAdmin } from '@/utils/supabase/admin'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin()
  return <div className="min-h-screen md:flex"><AdminSidebar email={user.email ?? 'Admin account'} /><main className="min-w-0 flex-1 bg-ink px-5 py-7 sm:px-8 sm:py-10 lg:px-12">{children}</main></div>
}
