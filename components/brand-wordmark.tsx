import Image from 'next/image'

export function BrandWordmark() {
  return (
    <span className="relative inline-block h-7 w-28 shrink-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/adrenax-wordmark.png"
        alt=""
        width={420}
        height={594}
        unoptimized
        className="absolute left-1/2 top-[-85px] h-[198px] w-[140px] max-w-none -translate-x-1/2"
      />
    </span>
  )
}
