import Link from 'next/link'
import { ArrowRight, Boxes, CircleAlert, PackageCheck, Plus, Tags } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { requireAdmin } from '@/utils/supabase/admin'

export const metadata = { title: 'Admin overview' }

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin()
  const [{ count: total }, { count: active }, { count: lowStock }, { data: latest }, { count: categories }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_deleted', false).gt('stock_quantity', 0),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_deleted', false).lte('stock_quantity', 5),
    supabase.from('products').select('id,name,price,stock_quantity,created_at').eq('is_deleted', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ])
  const metrics = [
    { label: 'Active products', value: active ?? 0, hint: `${total ?? 0} total in inventory`, icon: Boxes },
    { label: 'Low stock', value: lowStock ?? 0, hint: '5 units or fewer', icon: CircleAlert, warning: (lowStock ?? 0) > 0 },
    { label: 'Collections', value: categories ?? 0, hint: 'Available on the storefront', icon: Tags },
  ]
  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Operations</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Good to have you back.</h1><p className="mt-2 text-sm text-white/40">A clear view of your store, all in one place.</p></div><Link href="/admin/products/add" className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-neon px-5 text-sm font-bold text-ink transition hover:bg-neon-bright"><Plus size={16} /> Add product</Link></div>
    <div className="mt-9 grid gap-4 sm:grid-cols-3">{metrics.map(({ label, value, hint, icon: Icon, warning }) => <Card key={label} className="p-5"><div className="flex items-start justify-between"><div><div className="text-sm text-white/45">{label}</div><div className={`mt-3 text-3xl font-bold ${warning ? 'text-gold' : ''}`}>{value}</div></div><div className={`grid size-10 place-items-center rounded-xl ${warning ? 'bg-gold/10 text-gold' : 'bg-neon/10 text-neon'}`}><Icon size={18} /></div></div><div className="mt-4 text-xs text-white/30">{hint}</div></Card>)}</div>
    <Card className="mt-7 overflow-hidden"><div className="flex items-center justify-between border-b border-white/[.08] px-5 py-4 sm:px-6"><div><h2 className="font-semibold">Recently added</h2><p className="mt-1 text-xs text-white/35">Latest products in your inventory</p></div><Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon">View inventory <ArrowRight size={14} /></Link></div>
      {latest?.length ? <div className="divide-y divide-white/[.06]">{latest.map((product) => <div key={product.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[.05] text-white/40"><PackageCheck size={16} /></div><div className="min-w-0"><div className="truncate text-sm font-medium">{product.name}</div><div className="mt-1 text-xs text-white/35">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(product.created_at))}</div></div></div><div className="shrink-0 text-right"><div className="text-sm font-medium">₹{Number(product.price).toLocaleString('en-IN')}</div><div className={`mt-1 text-xs ${product.stock_quantity <= 5 ? 'text-gold' : 'text-white/35'}`}>{product.stock_quantity} in stock</div></div></div>)}</div> : <div className="px-6 py-12 text-center"><p className="text-sm font-medium text-white/75">Your inventory starts with one good idea.</p><p className="mt-2 text-xs text-white/35">Add a product and it can go live in the storefront.</p><Link href="/admin/products/add" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-neon">Add your first product <ArrowRight size={14} /></Link></div>}
    </Card>
    <div className="mt-5 text-xs leading-5 text-white/30">Sales analytics will appear here when an order and payment system is connected.</div>
  </div>
}
