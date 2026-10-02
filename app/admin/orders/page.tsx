import { ClipboardList, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Json } from '@/types/database.types'
import { requireAdmin } from '@/utils/supabase/admin'

export const metadata = { title: 'Orders' }
type Address = { email?: string; name?: string; phone?: string; address_line_1?: string; address_line_2?: string; city?: string; state?: string; postal_code?: string; country?: string }
const money = (amountPaise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amountPaise / 100)

function getAddress(value: Json): Address {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Address : {}
}

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin()
  const { data: orders } = await supabase.from('orders').select('id,user_id,amount_paise,status,shipping_address,created_at').order('created_at', { ascending: false }).limit(100)
  const orderIds = orders?.map((order) => order.id) ?? []
  const { data: items } = orderIds.length
    ? await supabase.from('order_items').select('order_id,product_name,quantity,unit_price_paise').in('order_id', orderIds)
    : { data: [] }
  const itemsByOrder = new Map<string, NonNullable<typeof items>>()
  for (const item of items ?? []) itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item])
  const paidTotal = (orders ?? []).filter((order) => order.status === 'paid').reduce((total, order) => total + order.amount_paise, 0)

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Store operations</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Customer orders<span className="text-neon">.</span></h1><p className="mt-2 text-sm text-white/40">Payment-confirmed orders and delivery details.</p></div><Card className="px-5 py-4"><p className="text-xs text-white/40">Captured sales · latest 100</p><p className="mt-1 text-xl font-bold">{money(paidTotal)}</p></Card></div>

    {orders?.length ? <div className="mt-8 space-y-4">{orders.map((order) => {
      const address = getAddress(order.shipping_address)
      const orderItems = itemsByOrder.get(order.id) ?? []
      return <Card key={order.id} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] px-5 py-4 sm:px-6"><div><p className="font-semibold">Order {order.id.slice(0, 8).toUpperCase()}</p><p className="mt-1 text-xs text-white/40">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.created_at))}</p></div><div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1 text-[11px] capitalize ${order.status === 'paid' ? 'border-neon/20 bg-neon/[.07] text-neon' : order.status === 'refund_required' ? 'border-gold/25 bg-gold/[.06] text-gold' : 'border-white/10 text-white/50'}`}>{order.status.replaceAll('_', ' ')}</span><span className="font-semibold">{money(order.amount_paise)}</span></div></div>
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_1fr] sm:px-6">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-white/35">Items</p><div className="space-y-2">{orderItems.map((item, index) => <div key={`${item.product_name}-${index}`} className="flex justify-between gap-3 text-sm"><span className="text-white/70">{item.product_name} <span className="text-white/35">× {item.quantity}</span></span><span className="shrink-0 text-white/45">{money(item.unit_price_paise * item.quantity)}</span></div>)}</div></div>
          <div><p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] text-white/35"><MapPin size={13} /> Deliver to</p><div className="text-sm leading-6 text-white/70"><p className="font-semibold">{address.name || 'Customer'}{address.phone ? ` · ${address.phone}` : ''}</p>{address.email && <p className="text-white/45">{address.email}</p>}<p>{address.address_line_1}{address.address_line_2 ? `, ${address.address_line_2}` : ''}</p><p>{[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}</p><p>{address.country === 'IN' ? 'India' : address.country}</p></div></div>
        </div>
        {order.status === 'refund_required' && <div className="border-t border-gold/15 bg-gold/[.04] px-5 py-3 text-xs text-gold-soft/80 sm:px-6">Inventory changed after payment capture. Review this payment in Razorpay and arrange a refund before fulfillment.</div>}
      </Card>
    })}</div> : <Card className="mt-8 grid min-h-64 place-items-center border-dashed px-6 text-center"><div><ClipboardList className="mx-auto text-white/25" size={25} /><h2 className="mt-4 font-semibold">No orders yet.</h2><p className="mt-2 text-sm text-white/40">Customer orders will appear here after a payment is captured.</p></div></Card>}
  </div>
}
