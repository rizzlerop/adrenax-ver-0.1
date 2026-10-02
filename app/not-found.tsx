import Link from 'next/link'
export default function NotFound() {
  return <main className="grid min-h-[65vh] place-items-center px-5 text-center"><div><p className="eyebrow">404 · Off the map</p><h1 className="mt-4 text-4xl font-bold">We couldn’t find that.</h1><p className="mt-3 text-white/45">This product may have moved or sold out.</p><Link href="/shop" className="mt-7 inline-flex h-11 items-center rounded-full bg-neon px-5 text-sm font-bold text-ink">Back to the shop</Link></div></main>
}
