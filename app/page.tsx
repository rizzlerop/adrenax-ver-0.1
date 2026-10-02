import Link from 'next/link'
import { ArrowDownRight, ArrowRight, ArrowUpRight, MoveUpRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'
import { ProductImage } from '@/components/ui/product-image'
import { Card } from '@/components/ui/card'

type Product = { id: string; name: string; price: number; image_url: string | null; stock_quantity: number }

async function getFeaturedProducts(): Promise<Product[]> {
  if (!getSupabaseConfig()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('id,name,price,image_url,stock_quantity').eq('is_deleted', false).gt('stock_quantity', 0).order('created_at', { ascending: false }).limit(4)
    return data ?? []
  } catch { return [] }
}

async function getCategories() {
  if (!getSupabaseConfig()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('id,name').order('name')
    return data ?? []
  } catch { return [] }
}

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()])
  return <main>
    <section className="relative isolate min-h-[650px] overflow-hidden border-b border-white/[.06] sm:min-h-[730px]">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_43%,rgba(184,75,255,.19),transparent_38%),linear-gradient(115deg,#08060c_24%,#171020_100%)]" />
      <div className="absolute -right-40 top-12 -z-10 size-[560px] rounded-full border border-neon/10 sm:right-[9%] sm:top-24 sm:size-[640px]" />
      <div className="absolute right-[9%] top-24 -z-10 hidden h-[620px] w-[430px] rotate-[17deg] rounded-[48%] border border-white/[.07] bg-[linear-gradient(140deg,rgba(196,77,255,.13),rgba(255,255,255,.015)_30%,transparent_65%)] shadow-[0_0_150px_rgba(196,77,255,.12)] sm:block" />
      <div className="mx-auto flex min-h-[650px] max-w-7xl items-center px-5 py-20 sm:min-h-[730px] sm:px-8">
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-gold"><span className="size-1.5 rounded-full bg-neon" /> Drop 01 · Built for momentum</div>
          <h1 className="text-[clamp(4rem,10vw,8.6rem)] font-black leading-[.82] tracking-[-.075em]">MOVE<br /><span className="text-neon">WITH</span><br />INTENT<span className="text-neon">.</span></h1>
          <p className="mt-8 max-w-md text-base leading-7 text-white/50 sm:text-lg">Performance gear that meets you where the work begins. Made to go further, every day.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/shop" className="group inline-flex h-12 items-center gap-3 rounded-full bg-neon px-6 text-sm font-bold text-ink transition hover:bg-neon-bright">Shop the collection <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link><a href="#collections" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-sm font-semibold text-white/75 transition hover:border-white/35 hover:text-white">Explore <ArrowDownRight size={15} /></a></div>
          <div className="mt-14 flex gap-8 border-t border-white/10 pt-5 text-[10px] font-bold uppercase tracking-[.16em] text-white/35 sm:gap-12"><span>Made to move</span><span>Designed to last</span><span>Ready for anything</span></div>
        </div>
        <div className="absolute bottom-10 right-8 hidden rotate-90 text-[10px] uppercase tracking-[.25em] text-white/25 xl:block">Scroll to explore</div>
      </div>
      <div className="absolute bottom-0 left-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
    </section>

    <section id="collections" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mb-10 flex items-end justify-between gap-4"><div><p className="eyebrow">Find your pace</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Shop by collection</h2></div><Link href="/collections" className="inline-flex shrink-0 items-center gap-2 text-xs text-white/55 hover:text-neon sm:text-sm">View all <ArrowUpRight size={15} /></Link></div>
      {categories.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categories.slice(0, 3).map((category, index) => <Link key={category.id} href={`/collections/${category.id}`} className={`group relative flex min-h-60 flex-col justify-end overflow-hidden rounded-2xl border border-white/[.08] p-7 transition hover:border-neon/40 ${index === 0 ? 'bg-[radial-gradient(ellipse_at_80%_20%,rgba(196,77,255,.16),transparent_44%),#110d18]' : index === 1 ? 'bg-[radial-gradient(ellipse_at_80%_20%,rgba(215,177,94,.11),transparent_44%),#110d18]' : 'bg-[radial-gradient(ellipse_at_80%_20%,rgba(126,59,185,.15),transparent_44%),#110d18]'}`}><span className="absolute right-6 top-6 text-[10px] font-bold uppercase tracking-[.2em] text-white/30">0{index + 1}</span><span className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-neon">Collection</span><span className="flex items-center justify-between text-2xl font-bold">{category.name}<MoveUpRight className="text-white/35 transition group-hover:text-neon" /></span></Link>)}</div> : <Card className="grid min-h-60 place-items-center border-dashed px-6 text-center text-white/45"><div><p className="text-lg font-semibold text-white/75">Your next collection starts here.</p><p className="mt-2 text-sm">Add categories in Supabase to feature them on the storefront.</p></div></Card>}
    </section>

    <section className="border-y border-white/[.06] bg-[#0b0910]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mb-9 flex items-end justify-between"><div><p className="eyebrow">The current rotation</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Featured gear</h2></div><Link href="/shop" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-neon">Shop all <ArrowRight size={15} /></Link></div>
        {products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">{products.map((product) => <Link key={product.id} href={`/shop/${product.id}`} className="group"><ProductImage src={product.image_url} alt={product.name} className="aspect-[.82] rounded-2xl" /><div className="flex items-start justify-between gap-2 pt-4"><div><h3 className="font-semibold">{product.name}</h3><p className="mt-1 text-sm text-white/45">{product.stock_quantity} available</p></div><span className="text-sm font-semibold">{money(product.price)}</span></div></Link>)}</div> : <Card className="grid min-h-48 place-items-center border-dashed px-6 text-center text-white/45"><div><p className="font-semibold text-white/75">The first drop is on its way.</p><p className="mt-2 text-sm">Add products in the admin portal to see them here.</p></div></Card>}
      </div>
    </section>

    <section id="story" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28"><div className="grid gap-8 rounded-3xl border border-white/[.08] bg-[radial-gradient(ellipse_at_90%_10%,rgba(196,77,255,.1),transparent_35%),#110d18] p-8 sm:grid-cols-[1fr_auto] sm:items-end sm:p-12"><div><p className="eyebrow">Stay in motion</p><h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">No finish line.<br />Just the next thing.</h2><p className="mt-5 max-w-md leading-7 text-white/50">Find the pieces that keep up with you. Built for training, the long way home, and everything between.</p></div><Link href="/shop" className="inline-flex h-12 items-center gap-3 rounded-full border border-white/20 px-6 text-sm font-semibold transition hover:border-neon hover:text-neon">Find your gear <ArrowUpRight size={15} /></Link></div></section>
  </main>
}
