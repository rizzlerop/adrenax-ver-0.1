'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'

type SessionState = 'checking' | 'ready' | 'invalid'

export function SetPasswordForm({ invalidLink }: { invalidLink: boolean }) {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<SessionState>(invalidLink ? 'invalid' : 'checking')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (invalidLink) return
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionState(session ? 'ready' : 'invalid')
    })
  }, [invalidLink])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setPending(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: role } = user
      ? await supabase.from('user_roles').select('is_admin').eq('id', user.id).maybeSingle()
      : { data: null }
    router.replace(role?.is_admin ? '/admin' : '/')
    router.refresh()
  }

  return (
    <main className="grid min-h-[78vh] place-items-center px-5 py-14">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"><ArrowLeft size={15} /> Back to sign in</Link>
        <section className="mt-7 rounded-3xl border border-white/[.09] bg-panel p-7 sm:p-9">
          <div className="grid size-11 place-items-center rounded-2xl bg-neon text-ink"><KeyRound size={19} /></div>
          <p className="eyebrow mt-7">Secure your account</p>
          <h1 className="mt-2 text-3xl font-bold">Set your password.</h1>
          <p className="mt-2 text-sm leading-6 text-white/45">Choose a password to finish setting up your ADRENAX account.</p>

          {sessionState === 'checking' && <p className="mt-6 text-sm text-white/55">Checking your secure link…</p>}
          {sessionState === 'invalid' && <div className="mt-6 space-y-4"><p role="alert" className="rounded-xl border border-red-300/20 bg-red-200/[.05] p-3 text-sm text-red-100/80">This link is invalid or has expired. Request a fresh invitation or password reset email.</p><Link href="/login" className="text-sm text-neon hover:underline">Return to sign in</Link></div>}
          {sessionState === 'ready' && !success && <form onSubmit={handleSubmit} className="mt-7 space-y-4"><label className="block text-xs font-medium text-white/55">New password<Input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" className="mt-2" /></label><label className="block text-xs font-medium text-white/55">Confirm password<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required placeholder="Enter it again" className="mt-2" /></label>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}<Button className="mt-2 w-full" disabled={pending}>{pending ? 'Saving…' : 'Save password'}</Button></form>}
          {success && <p role="status" className="mt-6 text-sm text-neon">Password saved. Opening the admin portal…</p>}
        </section>
      </div>
    </main>
  )
}
