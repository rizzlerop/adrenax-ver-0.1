import Link from 'next/link'
import { Boxes, ClipboardList, Layers3, LayoutDashboard, Plus, Store } from 'lucide-react'
import { signOutAction } from '@/app/actions/auth'
import { BrandMark } from './brand-mark'
import { BrandWordmark } from './brand-wordmark'

const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/collections', label: 'Collections', icon: Layers3 },
  { href: '/admin/products/add', label: 'Add product', icon: Plus },
]

export function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.08] bg-panel p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-6">
      <Link href="/" aria-label="ADRENAX admin home" className="mb-8 flex items-center gap-2.5 px-2">
        <BrandMark /><span className="flex items-center gap-1.5"><BrandWordmark /><span className="text-[10px] font-bold tracking-[.14em] text-gold">OPS</span></span>
      </Link>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/30">Workspace</div>
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55 transition hover:bg-white/[.06] hover:text-white"><Icon size={17} />{label}</Link>)}
      </nav>
      <div className="mt-auto hidden border-t border-white/[.08] pt-5 md:block">
        <div className="truncate px-3 text-xs text-white/35">{email}</div>
        <form action={signOutAction}><button className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm text-white/55 transition hover:bg-white/[.06] hover:text-white">Sign out</button></form>
        <Link href="/" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/35 hover:text-white"><Store size={14} />View storefront</Link>
      </div>
      <div className="mt-2 flex gap-3 md:hidden"><span className="flex-1 truncate self-center text-xs text-white/35">{email}</span><form action={signOutAction}><button className="rounded-xl px-3 py-2 text-xs text-white/55 hover:text-white">Sign out</button></form></div>
    </aside>
  )
}
