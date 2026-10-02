import Link from 'next/link'
import { ArrowUpRight, Boxes, Pencil, Plus, Trash2 } from 'lucide-react'
import { requireAdmin } from '@/utils/supabase/admin'
import { softDeleteProductAction } from './actions'
import { Card } from '@/components/ui/card'
import { ProductImage } from '@/components/ui/product-image'
import { Table } from '@/components/ui/table'

export const metadata = { title: 'Product inventory' }
type Props = { searchParams: Promise<{ notice?: string }> }

const notices: Record<string, string> = { added: 'Product added and published.', updated: 'Product changes saved.', deleted: 'Product moved out of the storefront.', error: 'The product could not be changed.' }

export default async function ProductsPage({ searchParams }: Props) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams])
  const { data: products } = await supabase.from('products').select('id,name,price,stock_quantity,image_url,category_id,created_at').eq('is_deleted', false).order('created_at', { ascending: false })
  const { data: categories } = await supabase.from('categories').select('id,name')
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]))
  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Store catalog</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Product inventory</h1><p className="mt-2 text-sm text-white/40">Manage the items customers can discover.</p></div><Link href="/admin/products/add" className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-neon px-5 text-sm font-bold text-ink hover:bg-neon-bright"><Plus size={16} /> Add product</Link></div>
    {query.notice && notices[query.notice] && <p className="mt-6 rounded-xl border border-neon/20 bg-neon/[.06] px-4 py-3 text-sm text-neon">{notices[query.notice]}</p>}
    <Card className="mt-7 overflow-hidden">{products?.length ? <div className="overflow-x-auto"><Table className="min-w-[720px] text-left"><thead className="border-b border-white/[.08] bg-white/[.02] text-[10px] font-bold uppercase tracking-[.16em] text-white/35"><tr><th className="px-5 py-4">Product</th><th className="px-4 py-4">Collection</th><th className="px-4 py-4">Price</th><th className="px-4 py-4">Stock</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/[.06]">{products.map((product) => <tr key={product.id} className="transition hover:bg-white/[.02]"><td className="px-5 py-4"><div className="flex items-center gap-3"><ProductImage src={product.image_url} alt="" className="size-12 shrink-0 rounded-lg" /><div className="min-w-0"><div className="max-w-60 truncate text-sm font-semibold">{product.name}</div><Link href={`/shop/${product.id}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/35 hover:text-neon">View listing <ArrowUpRight size={11} /></Link></div></div></td><td className="px-4 py-4 text-sm text-white/45">{product.category_id ? categoryMap.get(product.category_id) ?? '—' : '—'}</td><td className="px-4 py-4 text-sm">₹{Number(product.price).toLocaleString('en-IN')}</td><td className="px-4 py-4"><span className={`text-sm ${product.stock_quantity <= 5 ? 'text-gold' : 'text-white/60'}`}>{product.stock_quantity}</span><span className="ml-1 text-xs text-white/30">units</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link aria-label={`Edit ${product.name}`} href={`/admin/products/${product.id}/edit`} className="grid size-9 place-items-center rounded-full border border-white/10 text-white/50 hover:border-white/25 hover:text-white"><Pencil size={15} /></Link><form action={softDeleteProductAction}><input type="hidden" name="id" value={product.id} /><button aria-label={`Delete ${product.name}`} title="Remove from storefront" className="grid size-9 place-items-center rounded-full border border-white/10 text-white/50 hover:border-red-300/30 hover:text-red-200"><Trash2 size={15} /></button></form></div></td></tr>)}</tbody></Table></div> : <div className="grid min-h-72 place-items-center px-6 text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/[.05] text-white/30"><Boxes size={20} /></div><h2 className="mt-4 font-semibold">No products in your catalog yet.</h2><p className="mt-2 text-sm text-white/40">Add a product to make your first listing.</p><Link href="/admin/products/add" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neon">Add a product <Plus size={15} /></Link></div></div>}</Card>
    <p className="mt-4 text-xs text-white/30">Removing a product hides it from the storefront while preserving the record.</p>
  </div>
}
