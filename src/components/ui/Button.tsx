import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-padel-600 hover:bg-padel-700 text-white disabled:bg-gray-300 disabled:text-gray-500',
  secondary:
    'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
}

export function Button({
  variant = 'primary',
  children,
  loading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Vent...' : children}
    </button>
  )
}
