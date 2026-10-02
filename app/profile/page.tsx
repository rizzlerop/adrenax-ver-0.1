import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { CartPage } from '@/components/cart-page'
import { signOutAction } from '@/app/actions/auth'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'

export const metadata: Metadata = { title: 'Your profile' }

type Props = { searchParams: Promise<{ access?: string }> }

export default async function ProfilePage({ searchParams }: Props) {
  if (!getSupabaseConfig()) redirect('/login?setup=1')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fprofile')

  const { data: role } = await supabase.from('user_roles').select('is_admin').eq('id', user.id).maybeSingle()
  const params = await searchParams
  const displayName = typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
    ? user.user_metadata.full_name.trim()
    : user.email?.split('@')[0] ?? 'Member'

  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
    <p className="eyebrow">Account center</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Your profile<span className="text-neon">.</span></h1>
    <section className="mt-8 flex flex-col gap-5 rounded-3xl border border-white/[.08] bg-panel p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-neon text-ink"><UserRound size={24} /></div>
        <div className="min-w-0"><p className="truncate text-xl font-semibold">{displayName}</p><p className="mt-1 truncate text-sm text-white/45">{user.email}</p><span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wider text-white/55">{role?.is_admin ? <><ShieldCheck size={13} /> Admin account</> : 'Customer account'}</span></div>
      </div>
      <form action={signOutAction}><button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-5 text-sm font-semibold text-white/65 transition hover:border-neon/50 hover:text-white"><LogOut size={15} /> Sign out</button></form>
    </section>
    {params.access === 'admin' && <p className="mt-5 rounded-2xl border border-gold/20 bg-gold/[.06] p-4 text-sm text-gold-soft/85">The admin portal is limited to admin accounts. Your customer profile and cart are here.</p>}
    <div className="mt-12"><CartPage embedded /></div>
  </main>
}
