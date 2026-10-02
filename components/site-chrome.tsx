'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Navbar } from './navbar'
import { BrandMark } from './brand-mark'
import { BrandWordmark } from './brand-wordmark'

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  if (isAdmin) return <>{children}</>

  return <><Navbar />{children}<footer className="border-t border-white/[0.08]">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <Link href="/" aria-label="ADRENAX home" className="inline-flex items-center gap-2"><BrandMark /><BrandWordmark /><span className="text-gold">.</span></Link>
      <p>Built for the ones who keep moving.</p>
      <div className="flex gap-5"><Link href="/shop" className="hover:text-white">Shop</Link><Link href="/cart" className="hover:text-white">Bag</Link><Link href="/login" className="hover:text-white">Account</Link></div>
    </div>
  </footer></>
}
