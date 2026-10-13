import Link from 'next/link'
import { ArrowUpRight, Layers3, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { addCollectionAction } from './actions'
import { requireAdmin } from '@/utils/supabase/admin'

export const metadata = { title: 'Collections' }

type Props = { searchParams: Promise<{ notice?: string }> }

const notices: Record<string, { message: string; tone: string }> = {
  added: { message: 'Collection created. It is now available in the storefront and product editor.', tone: 'border-neon/20 bg-neon/[.06] text-neon' },
  duplicate: { message: 'A collection with that name already exists.', tone: 'border-gold/20 bg-gold/[.06] text-gold-soft' },
  invalid: { message: 'Collection names must be between 2 and 80 characters.', tone: 'border-red-300/20 bg-red-200/[.05] text-red-100/80' },
  error: { message: 'The collection could not be saved. Please try again.', tone: 'border-red-300/20 bg-red-200/[.05] text-red-100/80' },
}

export default async function AdminCollectionsPage({ searchParams }: Props) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams])
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id,name,created_at').order('created_at', { ascending: false }),
    supabase.from('products').select('category_id').eq('is_deleted', false),
  ])
  const productCounts = new Map<string, number>()
  for (const product of products ?? []) {
    if (product.category_id) productCounts.set(product.category_id, (productCounts.get(product.category_id) ?? 0) + 1)
  }

  return <div className="mx-auto max-w-6xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Store catalog</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Collections<span className="text-neon">.</span></h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/40">Create storefront collections and assign products to them from the product editor.</p></div>
      <Link href="/collections" target="_blank" className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-white/10 px-4 text-sm text-white/65 transition hover:border-white/25 hover:text-white">View storefront <ArrowUpRight size={15} /></Link>
    </div>

    {query.notice && notices[query.notice] && <p role="status" className={`mt-6 rounded-xl border px-4 py-3 text-sm ${notices[query.notice].tone}`}>{notices[query.notice].message}</p>}

    <Card className="mt-7 p-5 sm:p-6">
      <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon"><Plus size={18} /></div><div><h2 className="font-semibold">Create a collection</h2><p className="mt-1 text-sm text-white/40">Collections appear on the public Collections page.</p></div></div>
      <form action={addCollectionAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="collection-name">Collection name</label>
        <Input id="collection-name" name="name" required minLength={2} maxLength={80} placeholder="e.g. Training Essentials" className="sm:max-w-md" />
        <Button className="shrink-0"><Plus size={16} /> Add collection</Button>
      </form>
    </Card>

    <div className="mb-3 mt-9 flex items-center justify-between"><h2 className="font-semibold">Your collections</h2><span className="text-xs text-white/35">{categories?.length ?? 0} total</span></div>
    {categories?.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{categories.map((category) => <Card key={category.id} className="flex items-center gap-4 p-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[.05] text-white/55"><Layers3 size={18} /></div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{category.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-white/40"><ShoppingBag size={12} />{productCounts.get(category.id) ?? 0} active {(productCounts.get(category.id) ?? 0) === 1 ? 'product' : 'products'}</p></div><Link href={`/admin/products/add?category=${encodeURIComponent(category.id)}`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-neon px-3 text-xs font-semibold text-ink transition hover:bg-neon-bright"><Plus size={14} />Add product</Link><Link aria-label={`View ${category.name} collection`} href={`/collections/${category.id}`} target="_blank" className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/45 transition hover:border-neon/30 hover:text-neon"><ArrowUpRight size={15} /></Link></Card>)}</div> : <Card className="grid min-h-52 place-items-center border-dashed px-6 text-center"><div><Layers3 className="mx-auto text-white/25" size={25} /><h2 className="mt-4 font-semibold">No collections yet.</h2><p className="mt-2 text-sm text-white/40">Create your first collection above to organize products.</p></div></Card>}
  </div>
}
