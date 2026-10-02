import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'
import { SiteChrome } from '@/components/site-chrome'
import { AuthLinkRedirect } from '@/components/auth-link-redirect'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'

export const metadata: Metadata = {
  title: { default: 'ADRENAX — Move with intent', template: '%s | ADRENAX' },
  description: 'Performance gear and everyday essentials for the ones who keep moving.',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let userId: string | null = null
  if (getSupabaseConfig()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  }

  return <html lang="en"><body><CartProvider key={userId ?? 'guest'} userId={userId}><AuthLinkRedirect /><SiteChrome signedIn={Boolean(userId)}>{children}</SiteChrome></CartProvider></body></html>
}
