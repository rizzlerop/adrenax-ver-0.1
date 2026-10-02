'use client'

import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from './cart-provider'
import { ProductImage } from './ui/product-image'
import { Button } from './ui/button'

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export function CartPage({ embedded = false }: { embedded?: boolean }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  if (!items.length) {
    const emptyState = <div className={embedded ? 'mt-7 rounded-2xl border border-white/[.08] bg-panel/60 px-6 py-10 text-center' : 'mx-auto grid min-h-[72vh] max-w-7xl place-items-center px-5 py-16 text-center'}><div><div className="mx-auto grid size-16 place-items-center rounded-full border border-white/10 bg-panel text-white/40"><ShoppingBag /></div><h2 className="mt-6 text-2xl font-bold">Your bag is taking a breather.</h2><p className="mt-3 text-sm text-white/45">Find something that keeps up with you.</p><Link href="/shop" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-neon px-5 text-sm font-bold text-ink">Explore the shop <ArrowLeft className="rotate-180" size={15} /></Link></div></div>
    return embedded ? <section><p className="eyebrow">Your cart</p><h2 className="mt-2 text-3xl font-bold">Nothing in the bag yet<span className="text-neon">.</span></h2>{emptyState}</section> : <main>{emptyState}</main>
  }

  const contents = <>
    <p className="eyebrow">Ready when you are</p>
    <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{embedded ? 'Your cart' : 'Your bag'}<span className="text-neon">.</span></h2>
    <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="divide-y divide-white/[.08] border-y border-white/[.08]">{items.map((item) => <article key={item.id} className="flex gap-4 py-5 sm:gap-6"><Link href={`/shop/${item.id}`} className="group w-28 shrink-0 sm:w-36"><ProductImage src={item.image_url} alt={item.name} className="aspect-[.82] rounded-xl" /></Link><div className="flex min-w-0 flex-1 flex-col justify-between gap-4 sm:flex-row"><div><Link href={`/shop/${item.id}`} className="font-semibold hover:text-neon">{item.name}</Link><p className="mt-1 text-sm text-white/45">{money(item.price)}</p><div className="mt-4 inline-flex items-center rounded-full border border-white/10"><button aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="grid size-9 place-items-center text-white/55 hover:text-white"><Minus size={14} /></button><span className="min-w-8 text-center text-sm">{item.quantity}</span><button aria-label="Increase quantity" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock_quantity} className="grid size-9 place-items-center text-white/55 hover:text-white disabled:opacity-30"><Plus size={14} /></button></div></div><div className="flex items-center justify-between gap-4 self-end sm:flex-col sm:items-end"><span className="font-semibold">{money(item.price * item.quantity)}</span><button onClick={() => removeItem(item.id)} className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-red-300"><Trash2 size={14} /> Remove</button></div></div></article>)}</div>
      <aside className="h-fit rounded-2xl border border-white/[.08] bg-panel p-6"><h3 className="text-lg font-semibold">Order summary</h3><div className="mt-6 flex justify-between text-sm text-white/55"><span>Subtotal</span><span className="text-white">{money(subtotal)}</span></div><div className="mt-3 flex justify-between text-sm text-white/55"><span>Shipping</span><span className="text-neon">Calculated at checkout</span></div><div className="my-5 border-t border-white/10" /><div className="flex justify-between font-semibold"><span>Total</span><span>{money(subtotal)}</span></div><Button className="mt-6 w-full" disabled>Checkout coming soon</Button><p className="mt-3 text-center text-xs leading-5 text-white/30">Online payment will be available soon. Your bag is saved to this account on this device.</p><Link href="/shop" className="mt-5 block text-center text-sm text-white/45 hover:text-neon">Continue shopping</Link></aside>
    </div>
  </>

  return embedded ? <section>{contents}</section> : <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-16">{contents}</main>
}
