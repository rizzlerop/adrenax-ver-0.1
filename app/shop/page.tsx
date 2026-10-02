import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'
import { ProductImage } from '@/components/ui/product-image'

type SearchParams = Promise<{ category?: string; min?: string; max?: string; q?: string; sort?: string }>
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams
  let products: { id: string; name: string; description: string; price: number; image_url: string | null; stock_quantity: number; category_id: string | null }[] = []
  let categories: { id: string; name: string }[] = []
  if (getSupabaseConfig()) {
    try {
      const supabase = await createClient()
      let query = supabase.from('products').select('id,name,description,price,image_url,stock_quantity,category_id').eq('is_deleted', false).gt('stock_quantity', 0)
      if (filters.category) query = query.eq('category_id', filters.category)
      const min = Number(filters.min)
      const max = Number(filters.max)
      if (filters.min && Number.isFinite(min)) query = query.gte('price', min)
      if (filters.max && Number.isFinite(max)) query = query.lte('price', max)
      if (filters.q?.trim()) query = query.ilike('name', `%${filters.q.trim()}%`)
      query = filters.sort === 'price_asc' ? query.order('price') : filters.sort === 'price_desc' ? query.order('price', { ascending: false }) : query.order('created_at', { ascending: false })
      const [{ data }, { data: categoryData }] = await Promise.all([query, supabase.from('categories').select('id,name').order('name')])
      products = data ?? []
      categories = categoryData ?? []
    } catch { /* Empty storefront state is shown if Supabase is unavailable. */ }
  }

  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
    <div className="mb-9"><p className="eyebrow">Adrenax supply</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Shop the gear<span className="text-neon">.</span></h1><p className="mt-3 max-w-lg text-white/45">Equipment and essentials made to move with you.</p></div>
    <form action="/shop" className="mb-9 grid gap-3 rounded-2xl border border-white/[.08] bg-panel p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_130px_130px_170px_auto] lg:items-end">
      <label className="text-xs font-medium text-white/45">Search<input name="q" defaultValue={filters.q} placeholder="Find your next piece" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0d0912] px-3 text-sm text-white outline-none focus:border-neon/60" /></label>
      <label className="text-xs font-medium text-white/45">Collection<select name="category" defaultValue={filters.category ?? ''} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0d0912] px-3 text-sm text-white outline-none focus:border-neon/60"><option value="">All collections</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="text-xs font-medium text-white/45">Min price<input name="min" type="number" min="0" defaultValue={filters.min} placeholder="₹0" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0d0912] px-3 text-sm text-white outline-none focus:border-neon/60" /></label>
      <label className="text-xs font-medium text-white/45">Max price<input name="max" type="number" min="0" defaultValue={filters.max} placeholder="Any" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0d0912] px-3 text-sm text-white outline-none focus:border-neon/60" /></label>
      <label className="text-xs font-medium text-white/45">Sort by<select name="sort" defaultValue={filters.sort ?? 'newest'} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0d0912] px-3 text-sm text-white outline-none focus:border-neon/60"><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label>
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-bold text-ink transition hover:bg-neon-bright"><SlidersHorizontal size={15} /> Filter</button>
    </form>
    <div className="mb-4 text-xs text-white/40">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</div>
    {products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-4">{products.map((product) => {
      const category = categories.find((item) => item.id === product.category_id)?.name
      return <Link key={product.id} href={`/shop/${product.id}`} className="group"><ProductImage src={product.image_url} alt={product.name} className="aspect-[.82] rounded-2xl" /><div className="pt-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-semibold">{product.name}</h2><p className="mt-1 text-xs text-white/40">{category ?? 'Adrenax gear'}</p></div><span className="text-sm font-semibold">{money(product.price)}</span></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-white/40">{product.description}</p></div></Link>
    })}</div> : <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/10 text-center"><div><Search className="mx-auto text-white/25" /><h2 className="mt-4 font-semibold">No gear found</h2><p className="mt-2 text-sm text-white/40">Try a different search or clear your filters.</p><Link href="/shop" className="mt-5 inline-block text-sm font-semibold text-neon">Reset filters</Link></div></div>}
  </main>
}
