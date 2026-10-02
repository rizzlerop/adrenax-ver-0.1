import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'
import { SiteChrome } from '@/components/site-chrome'
import { AuthLinkRedirect } from '@/components/auth-link-redirect'

export const metadata: Metadata = {
  title: { default: 'ADRENAX — Move with intent', template: '%s | ADRENAX' },
  description: 'Performance gear and everyday essentials for the ones who keep moving.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CartProvider><AuthLinkRedirect /><SiteChrome>{children}</SiteChrome></CartProvider></body></html>
}
