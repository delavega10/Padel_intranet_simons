import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const interactive = onClick ? 'cursor-pointer hover:border-padel-300 hover:shadow-md' : ''
  return (
    <div
      className={`content-card ${interactive} ${className}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-semibold text-gray-900">{children}</h3>
}

export function CardMeta({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-gray-500">{children}</p>
}
