'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowLeft, UserRoundPlus } from 'lucide-react'
import { registerAction, type RegisterState } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initialState: RegisterState = {}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState)

  return (
    <main className="grid min-h-[78vh] place-items-center px-5 py-14">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"><ArrowLeft size={15} /> Back to store</Link>
        <section className="mt-7 rounded-3xl border border-white/[.09] bg-panel p-7 sm:p-9">
          <div className="grid size-11 place-items-center rounded-2xl bg-neon text-ink"><UserRoundPlus size={19} /></div>
          <p className="eyebrow mt-7">Customer account</p>
          <h1 className="mt-2 text-3xl font-bold">Join ADRENAX.</h1>
          <p className="mt-2 text-sm leading-6 text-white/45">Create an account to shop the storefront. Admin access is assigned separately.</p>

          {state.notice ? <p role="status" className="mt-6 rounded-xl border border-neon/20 bg-neon/[.06] p-3 text-sm text-neon">{state.notice}</p> : (
            <form action={action} className="mt-7 space-y-4">
              <label className="block text-xs font-medium text-white/55">Email address<Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="mt-2" /></label>
              <label className="block text-xs font-medium text-white/55">Password<Input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" className="mt-2" /></label>
              <label className="block text-xs font-medium text-white/55">Confirm password<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required placeholder="Enter it again" className="mt-2" /></label>
              {state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
              <Button className="mt-2 w-full" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-white/40">Already have an account? <Link href="/login" className="text-neon hover:underline">Sign in</Link></p>
        </section>
      </div>
    </main>
  )
}
