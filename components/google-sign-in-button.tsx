'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function signInWithGoogle() {
    setPending(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      })
      if (authError) throw authError
      if (!data.url) throw new Error('Supabase did not return a Google sign-in URL.')
      window.location.assign(data.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Google sign-in could not start.')
      setPending(false)
    }
  }

  return <div>
    <Button type="button" variant="secondary" className="w-full" disabled={pending} onClick={signInWithGoogle}>
      <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4]">G</span>
      {pending ? 'Connecting to Google…' : 'Continue with Google'}
    </Button>
    {error && <p role="alert" className="mt-3 text-center text-xs leading-5 text-red-300">{error}</p>}
  </div>
}
