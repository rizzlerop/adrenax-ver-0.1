import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { ProductImage } from '@/components/ui/product-image'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'

type Props = { params: Promise<{ id: string }> }
type Collection = { id: string; name: string }
type CollectionProduct = { id: string; name: string; description: string; price: number; image_url: string | null; stock_quantity: number }

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

async function getCollection(id: string): Promise<{ collection: Collection; products: CollectionProduct[] } | null> {
  if (!getSupabaseConfig()) return null

  const supabase = await createClient()
  const [{ data: collection }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id,name').eq('id', id).maybeSingle(),
    supabase.from('products').select('id,name,description,price,image_url,stock_quantity').eq('category_id', id).eq('is_deleted', false).gt('stock_quantity', 0).order('created_at', { ascending: false }),
  ])
  if (!collection) return null
  return { collection, products: products ?? [] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const result = await getCollection(id).catch(() => null)
  return { title: result?.collection.name ?? 'Collection' }
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params
  const result = await getCollection(id).catch(() => null)
  if (!result) notFound()

  const { collection, products } = result
  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
    <Link href="/collections" className="mb-7 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"><ArrowLeft size={15} /> All collections</Link>
    <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-[radial-gradient(ellipse_at_82%_10%,rgba(196,77,255,.18),transparent_38%),linear-gradient(120deg,#110d18,#09070d)] px-7 py-10 sm:px-12 sm:py-14">
      <div className="absolute -right-12 -top-24 size-72 rounded-full border border-neon/10 sm:right-12 sm:top-[-8rem] sm:size-96" />
      <div className="relative max-w-2xl"><p className="eyebrow">ADRENAX collection</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{collection.name}<span className="text-neon">.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/50 sm:text-base">Explore every piece in this collection, selected to keep you moving.</p></div>
    </section>

    <section className="py-10 sm:py-14" aria-label={`${collection.name} products`}>
      <div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">The collection</p><h2 className="mt-2 text-2xl font-bold">Available gear</h2></div><span className="text-xs text-white/40">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span></div>
      {products.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">{products.map((product) => <Link key={product.id} href={`/shop/${product.id}`} className="group">
        <ProductImage src={product.image_url} alt={product.name} className="aspect-[.82] rounded-2xl" />
        <div className="pt-4"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{product.name}</h3><span className="shrink-0 text-sm font-semibold">{money(product.price)}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/40">{product.description}</p><p className="mt-3 text-xs text-white/35">{product.stock_quantity} available</p></div>
      </Link>)}</div> : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-white/10 px-6 text-center"><div><Search className="mx-auto text-white/25" size={22} /><h2 className="mt-4 font-semibold">This collection is restocking.</h2><p className="mt-2 text-sm text-white/45">Take a look at the rest of the lineup while we get more gear ready.</p><Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neon">Shop all products <ArrowRight size={15} /></Link></div></div>}
    </section>
  </main>
}
