import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Layers3 } from 'lucide-react'
import { ProductImage } from '@/components/ui/product-image'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'

export const metadata: Metadata = { title: 'Collections' }

type CollectionCard = {
  id: string
  name: string
  productCount: number
  imageUrl: string | null
  featuredProduct: string | null
}

async function getCollections(): Promise<CollectionCard[]> {
  if (!getSupabaseConfig()) return []

  try {
    const supabase = await createClient()
    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from('categories').select('id,name').order('name'),
      supabase.from('products').select('category_id,name,image_url').eq('is_deleted', false).gt('stock_quantity', 0).order('created_at', { ascending: false }),
    ])

    return (categories ?? []).map((category) => {
      const items = (products ?? []).filter((product) => product.category_id === category.id)
      return {
        id: category.id,
        name: category.name,
        productCount: items.length,
        imageUrl: items[0]?.image_url ?? null,
        featuredProduct: items[0]?.name ?? null,
      }
    })
  } catch {
    return []
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections()

  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
    <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-[radial-gradient(ellipse_at_82%_10%,rgba(196,77,255,.2),transparent_38%),linear-gradient(120deg,#110d18,#09070d)] px-7 py-12 sm:px-12 sm:py-16">
      <div className="absolute -right-12 -top-24 size-72 rounded-full border border-neon/10 sm:right-12 sm:top-[-8rem] sm:size-96" />
      <div className="relative max-w-2xl">
        <p className="eyebrow">Find your pace</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Collections<span className="text-neon">.</span></h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/50 sm:text-base">Explore the ADRENAX lineup by collection. Find the gear built for the way you move.</p>
        <Link href="/shop" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-neon">Browse every product <ArrowRight size={15} /></Link>
      </div>
    </section>

    <section className="py-12 sm:py-16" aria-label="All collections">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div><p className="eyebrow">The lineup</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Shop by collection</h2></div>
        <span className="text-xs text-white/40">{collections.length} {collections.length === 1 ? 'collection' : 'collections'}</span>
      </div>

      {collections.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection, index) => <Link key={collection.id} href={`/collections/${collection.id}`} className="group relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-panel p-6 transition hover:-translate-y-1 hover:border-neon/50 sm:min-h-[390px] sm:p-8">
          <div className="absolute inset-0 -z-20"><ProductImage src={collection.imageUrl} alt={collection.featuredProduct ?? collection.name} className="h-full w-full" /></div>
          <div className={`absolute inset-0 -z-10 ${index % 3 === 1 ? 'bg-gradient-to-t from-[#08060c] via-[#08060c]/60 to-gold/10' : 'bg-gradient-to-t from-[#08060c] via-[#08060c]/55 to-neon/10'}`} />
          <span className="absolute right-6 top-6 grid size-10 place-items-center rounded-full border border-white/15 bg-black/20 text-white/70 transition group-hover:border-neon/50 group-hover:text-neon"><ArrowUpRight size={17} /></span>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-neon"><Layers3 size={13} /> Collection {String(index + 1).padStart(2, '0')}</div>
          <h3 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{collection.name}</h3>
          <p className="mt-2 text-sm text-white/55">{collection.productCount ? `${collection.productCount} ${collection.productCount === 1 ? 'piece' : 'pieces'} to explore` : 'A new drop is on the way'}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-neon">Explore collection <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
        </Link>)}
      </div> : <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-white/10 px-6 text-center">
        <div><Layers3 className="mx-auto text-neon/70" size={24} /><h2 className="mt-4 font-semibold">Collections are on the way.</h2><p className="mt-2 text-sm text-white/45">Once the store has collections, they’ll appear here.</p><Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neon">Browse the shop <ArrowRight size={15} /></Link></div>
      </div>}
    </section>
  </main>
}
