import { redirect } from 'next/navigation'
import { createClient } from './server'
import { getSupabaseConfig } from './env'

export async function requireAdmin() {
  if (!getSupabaseConfig()) redirect('/login?setup=1')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fadmin')

  const { data: role } = await supabase
    .from('user_roles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!role?.is_admin) redirect('/login?denied=1')
  return { supabase, user }
}
