import Image from 'next/image'

export function BrandMark() {
  return (
    <span className="relative inline-block size-9 shrink-0 overflow-hidden" aria-hidden="true">
      <Image
        src="/adrenax-logo.png"
        alt=""
        width={240}
        height={240}
        unoptimized
        className="absolute left-1/2 top-1/2 h-[87px] w-[87px] max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </span>
  )
}
