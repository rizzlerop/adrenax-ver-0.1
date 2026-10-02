import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }

const variants = {
  primary: 'bg-neon text-ink hover:bg-neon-bright',
  secondary: 'border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.09]',
  ghost: 'text-white/65 hover:bg-white/[0.06] hover:text-white',
  danger: 'border border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/20',
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />
}
