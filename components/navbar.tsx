'use client'

import Link from 'next/link'
import { ArrowUpRight, ShoppingBag, UserRound } from 'lucide-react'
import { useCart } from './cart-provider'
import { BrandMark } from './brand-mark'
import { BrandWordmark } from './brand-wordmark'

export function Navbar({ signedIn }: { signedIn: boolean }) {
  const { itemCount } = useCart()
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Adrenax home">
          <BrandMark />
          <span className="flex items-center gap-0.5"><BrandWordmark /><span className="text-gold">.</span></span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm text-white/55 md:flex">
          <Link className="transition hover:text-white" href="/shop">Shop all</Link>
          <a className="transition hover:text-white" href="/#collections">Collections</a>
          <a className="transition hover:text-white" href="/#story">Our edge</a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href={signedIn ? '/profile' : '/login'} aria-label={signedIn ? 'Your profile' : 'Sign in'} className="grid size-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-neon/60 hover:text-neon sm:flex sm:h-auto sm:w-auto sm:gap-1 sm:border-0"><UserRound className="sm:hidden" size={17} /><span className="hidden sm:inline">{signedIn ? 'Profile' : 'Account'}</span><ArrowUpRight className="hidden sm:inline" size={13} /></Link>
          <Link href="/cart" aria-label={`Shopping bag, ${itemCount} items`} className="relative grid size-10 place-items-center rounded-full border border-white/10 transition hover:border-neon/60 hover:text-neon">
            <ShoppingBag size={17} />
            {itemCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-neon px-1 text-[10px] font-bold text-ink">{itemCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}
