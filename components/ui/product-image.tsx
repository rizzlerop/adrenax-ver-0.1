import Image from 'next/image'
import { PackageOpen } from 'lucide-react'

export function ProductImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#1a1322] ${className}`}>
      {src ? <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" unoptimized /> : (
        <div className="absolute inset-0 grid place-items-center text-white/20"><PackageOpen size={40} strokeWidth={1.2} /></div>
      )}
    </div>
  )
}
