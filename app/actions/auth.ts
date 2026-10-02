'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'

export type LoginState = { error?: string }
export type RegisterState = { error?: string; notice?: string }

export async function signInAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  if (!getSupabaseConfig()) return { error: 'Supabase is not configured yet. Add the project URL and key to .env.local.' }
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Enter your email and password.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: 'Those login details did not match an account.' }

  const { data: role } = await supabase.from('user_roles').select('is_admin').eq('id', data.user.id).maybeSingle()
  const next = String(formData.get('next') ?? '')
  if (role?.is_admin) redirect(next.startsWith('/admin') ? next : '/admin')
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/')
}

export async function registerAction(_previousState: RegisterState, formData: FormData): Promise<RegisterState> {
  if (!getSupabaseConfig()) return { error: 'Supabase is not configured yet. Add the project URL and key to .env.local.' }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  if (!email || !password) return { error: 'Enter your email and password.' }
  if (password.length < 8) return { error: 'Choose a password with at least 8 characters.' }
  if (password !== confirmPassword) return { error: 'The passwords do not match.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (data.session) redirect('/')

  return { notice: 'Check your inbox for a confirmation link. After confirming your email, you can sign in.' }
}

export async function signOutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}
