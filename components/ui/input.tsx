import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const base = 'w-full rounded-xl border border-white/10 bg-[#0d0912] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-neon/70 focus:ring-2 focus:ring-neon/10'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} min-h-32 resize-y ${props.className ?? ''}`} />
}
