import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowRight, Check, Clock3, RotateCcw } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'

export const metadata: Metadata = { title: 'Order status' }
type Props = { searchParams: Promise<{ order?: string }> }
const money = (amountPaise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amountPaise / 100)

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  if (!getSupabaseConfig()) redirect('/login?setup=1')
  const { order: orderId } = await searchParams
  if (!orderId) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=%2Fprofile')

  const { data: order } = await supabase.from('orders').select('id,amount_paise,currency,status,created_at').eq('id', orderId).eq('user_id', user.id).maybeSingle()
  if (!order) notFound()
  const { data: items } = await supabase.from('order_items').select('product_name,unit_price_paise,quantity').eq('order_id', order.id)

  const paid = order.status === 'paid'
  const needsReview = order.status === 'refund_required'
  return <main className="mx-auto min-h-[72vh] max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
    <div className="rounded-3xl border border-white/[.08] bg-panel p-7 sm:p-10">
      <div className={`grid size-12 place-items-center rounded-2xl ${paid ? 'bg-neon text-ink' : needsReview ? 'bg-gold/15 text-gold' : 'bg-white/[.06] text-white/65'}`}>{paid ? <Check size={22} /> : needsReview ? <RotateCcw size={20} /> : <Clock3 size={20} />}</div>
      <p className="eyebrow mt-7">Order {order.id.slice(0, 8).toUpperCase()}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{paid ? 'Payment confirmed.' : needsReview ? 'Your payment needs attention.' : 'Payment is processing.'}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">{paid ? 'Your payment is captured and your order is recorded. You can review it any time from your profile.' : needsReview ? 'The payment was captured, but stock changed while checkout was completing. The store needs to review this order and arrange a refund.' : 'The payment provider is still confirming this order. Check your profile again shortly; please don’t submit another payment for this order.'}</p>

      <div className="mt-8 rounded-2xl border border-white/[.08] p-5">
        <div className="flex justify-between text-sm text-white/45"><span>Order total</span><span className="font-semibold text-white">{money(order.amount_paise)}</span></div>
        <div className="mt-4 divide-y divide-white/[.07] border-t border-white/[.08]">{(items ?? []).map((item, index) => <div key={`${item.product_name}-${index}`} className="flex justify-between gap-4 py-3 text-sm"><span className="text-white/70">{item.product_name} <span className="text-white/35">× {item.quantity}</span></span><span className="shrink-0 text-white/55">{money(item.unit_price_paise * item.quantity)}</span></div>)}</div>
      </div>
      <div className="mt-7 flex flex-wrap gap-3"><Link href="/profile" className="inline-flex h-11 items-center gap-2 rounded-full bg-neon px-5 text-sm font-bold text-ink">View profile <ArrowRight size={15} /></Link><Link href="/shop" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/70 hover:border-white/30 hover:text-white">Continue shopping</Link></div>
    </div>
  </main>
}
