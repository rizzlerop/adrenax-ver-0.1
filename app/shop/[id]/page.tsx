import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, Truck } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'
import { ProductImage } from '@/components/ui/product-image'
import { AddToCartButton } from '@/components/add-to-cart-button'

type Props = { params: Promise<{ id: string }> }
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

async function getProduct(id: string) {
  if (!getSupabaseConfig()) return null
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('id,name,description,price,image_url,stock_quantity,category_id').eq('id', id).eq('is_deleted', false).maybeSingle()
  if (!data) return null
  let category = null
  if (data.category_id) {
    const { data: categoryData } = await supabase.from('categories').select('name').eq('id', data.category_id).maybeSingle()
    category = categoryData?.name ?? null
  }
  return { ...data, category }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id).catch(() => null)
  return { title: product?.name ?? 'Product' }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id).catch(() => null)
  if (!product) notFound()
  return <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-14">
    <Link href="/shop" className="mb-7 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><ArrowLeft size={15} /> Back to shop</Link>
    <div className="grid gap-9 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
      <ProductImage src={product.image_url} alt={product.name} className="group aspect-[.88] rounded-3xl sm:aspect-square" />
      <div className="flex flex-col justify-center py-2"><p className="eyebrow">{product.category ?? 'Adrenax gear'}</p><h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">{product.name}</h1><div className="mt-5 text-2xl font-semibold">{money(product.price)}</div><p className="mt-7 max-w-xl whitespace-pre-line text-base leading-7 text-white/55">{product.description}</p>
        <div className="mt-8 flex items-center gap-2 text-sm">{product.stock_quantity > 0 ? <><span className="size-2 rounded-full bg-neon" /><span className="text-white/65">In stock <span className="text-white/35">· {product.stock_quantity} available</span></span></> : <><span className="size-2 rounded-full bg-red-400" /><span className="text-white/55">Out of stock</span></>}</div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><AddToCartButton item={product} disabled={product.stock_quantity < 1} /><Link href="/cart" className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold transition hover:border-white/30">View bag</Link></div>
        <div className="mt-9 space-y-3 border-t border-white/10 pt-6 text-sm text-white/45"><div className="flex items-center gap-3"><Truck size={17} className="text-neon" /> Reliable delivery to your door</div><div className="flex items-center gap-3"><Check size={17} className="text-neon" /> Designed for repeat wear</div></div>
      </div>
    </div>
  </main>
}
