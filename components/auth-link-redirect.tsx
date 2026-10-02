'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function AuthLinkRedirect() {
  const router = useRouter()

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const flow = hashParams.get('type')
    if (!['invite', 'recovery', 'signup', 'email'].includes(flow ?? '')) return

    const supabase = createClient()
    let active = true
    const redirectWithSession = () => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!active) return
        if (session && (flow === 'invite' || flow === 'recovery')) router.replace('/set-password')
        else if (session) router.replace('/')
        else if (hashParams.has('error_code') || hashParams.has('error_description')) {
          router.replace(flow === 'invite' || flow === 'recovery' ? '/set-password?link=invalid' : '/login')
        }
      })
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session || event !== 'SIGNED_IN') return
      router.replace(flow === 'invite' || flow === 'recovery' ? '/set-password' : '/')
    })
    redirectWithSession()

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [router])

  return null
}
