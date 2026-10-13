'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { signInAction, type LoginState } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GoogleSignInButton } from '@/components/google-sign-in-button'

const initialState: LoginState = {}

export function LoginForm({ setup, denied, oauthError }: { setup: boolean; denied: boolean; oauthError: boolean }) {
  const [state, action, pending] = useActionState(signInAction, initialState)
  return <main className="grid min-h-[78vh] place-items-center px-5 py-14"><div className="w-full max-w-md"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"><ArrowLeft size={15} /> Back to store</Link><div className="mt-7 rounded-3xl border border-white/[.09] bg-panel p-7 sm:p-9"><div className="grid size-11 place-items-center rounded-2xl bg-neon text-ink"><LockKeyhole size={19} /></div><p className="eyebrow mt-7">Account access</p><h1 className="mt-2 text-3xl font-bold">Welcome back.</h1><p className="mt-2 text-sm leading-6 text-white/45">Sign in to open your profile and saved cart. Admins will be taken to the inventory portal.</p>
      {setup && <p className="mt-5 rounded-xl border border-gold/20 bg-gold/[.06] p-3 text-sm text-gold-soft/80">Connect a Supabase project by adding the keys from .env.example to .env.local.</p>}
      {denied && <p className="mt-5 rounded-xl border border-red-300/20 bg-red-200/[.05] p-3 text-sm text-red-100/80">This account doesn’t have admin access. Sign in with an authorized account.</p>}
      {oauthError && <p role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-200/[.05] p-3 text-sm text-red-100/80">Google sign-in could not be completed. Check that Google is enabled in Supabase Auth, then try again.</p>}
      <form action={action} className="mt-7 space-y-4"><label className="block text-xs font-medium text-white/55">Email address<Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="mt-2" /></label><label className="block text-xs font-medium text-white/55">Password<Input name="password" type="password" autoComplete="current-password" required placeholder="Your password" className="mt-2" /></label>{state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}<Button className="mt-2 w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button></form>
      <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[.16em] text-white/25"><span className="h-px flex-1 bg-white/[.08]" />or<span className="h-px flex-1 bg-white/[.08]" /></div>
      <GoogleSignInButton />
      <p className="mt-6 text-center text-xs text-white/40">New to ADRENAX? <Link href="/register" className="text-neon hover:underline">Create a customer account</Link></p>
    </div></div></main>
}
