import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/login-form'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'

export const metadata: Metadata = { title: 'Sign in' }
type Props = { searchParams: Promise<{ setup?: string; denied?: string; oauthError?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  if (getSupabaseConfig()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: role } = await supabase.from('user_roles').select('is_admin').eq('id', user.id).maybeSingle()
      redirect(role?.is_admin ? '/admin' : '/profile')
    }
  }
  return <LoginForm setup={Boolean(params.setup)} denied={Boolean(params.denied)} oauthError={Boolean(params.oauthError)} />
}
